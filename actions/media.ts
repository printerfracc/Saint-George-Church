"use server";

import { revalidatePath } from "next/cache";
import type { MediaFileType } from "@/lib/cloudinary";
import {
  createMediaCollection,
  createMediaItem,
  deleteMediaCollection,
  deleteMediaItem,
  getMediaCollection,
  listMediaCollections,
  listMediaItems,
  updateMediaCollection,
  updateMediaItem,
} from "@/lib/media-db";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeExternalUrl } from "@/lib/media";

export type MediaActionResult =
  | { success: true }
  | { success: false; error: string };

async function ensureAdmin(): Promise<MediaActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

function revalidateMedia(collectionId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/media");
  revalidatePath("/media");

  if (collectionId) {
    revalidatePath(`/admin/media/${collectionId}`);
    revalidatePath(`/media/${collectionId}`);
  }
}

export async function listLibraryCollections() {
  try {
    return await listMediaCollections();
  } catch {
    return [];
  }
}

export async function getLibraryCollection(id: string) {
  try {
    const collection = await getMediaCollection(id);
    if (!collection) {
      return null;
    }

    const items = await listMediaItems(id);
    return { ...collection, items };
  } catch {
    return null;
  }
}

export async function saveLibraryCollection(data: {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string | null;
}): Promise<MediaActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  const title = data.title.trim();
  const description = data.description.trim();
  const imageUrl = data.imageUrl?.trim() || null;

  if (!title) {
    return { success: false, error: "يرجى إدخال اسم القسم" };
  }

  try {
    if (data.id) {
      await updateMediaCollection(data.id, { title, description, imageUrl });
      revalidateMedia(data.id);
    } else {
      const created = await createMediaCollection({ title, description, imageUrl });
      revalidateMedia(created.id);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ القسم",
    };
  }
}

export async function removeLibraryCollection(
  id: string,
): Promise<MediaActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await deleteMediaCollection(id);
    revalidateMedia(id);
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف القسم" };
  }
}

export async function saveLibraryItem(data: {
  id?: string;
  collectionId: string;
  title?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: MediaFileType | null;
  thumbnail?: string | null;
  link?: string | null;
  linkLabel?: string | null;
}): Promise<MediaActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  const title = data.title?.trim() ?? "";
  const fileUrl = data.fileUrl?.trim() || null;
  const thumbnail = data.thumbnail?.trim() || null;
  const linkInput = data.link?.trim() ?? "";
  const linkLabel = data.linkLabel?.trim() || null;
  const link = linkInput ? normalizeExternalUrl(linkInput) : null;
  const fileType: MediaFileType = fileUrl ? (data.fileType ?? "image") : "link";

  if (!fileUrl && !link && !title && !thumbnail) {
    return { success: false, error: "يرجى رفع ملف أو إدخال رابط أو عنوان" };
  }

  if (linkInput && !link) {
    return { success: false, error: "يرجى إدخال رابط صالح" };
  }

  const savedLinkLabel = link ? linkLabel : null;

  try {
    if (data.id) {
      await updateMediaItem(data.id, {
        title,
        fileUrl,
        fileName: fileUrl ? data.fileName?.trim() || null : null,
        fileType,
        thumbnail,
        link,
        linkLabel: savedLinkLabel,
      });
    } else {
      await createMediaItem({
        collectionId: data.collectionId,
        title,
        fileUrl,
        fileName: fileUrl ? data.fileName?.trim() || null : null,
        fileType,
        thumbnail,
        link,
        linkLabel: savedLinkLabel,
      });
    }

    revalidateMedia(data.collectionId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ الملف",
    };
  }
}

export async function removeLibraryItem(
  id: string,
  collectionId: string,
): Promise<MediaActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await deleteMediaItem(id);
    revalidateMedia(collectionId);
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف الملف" };
  }
}
