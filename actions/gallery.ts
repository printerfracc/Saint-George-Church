"use server";

import { revalidatePath } from "next/cache";
import { GALLERY_MEDIA_IMAGE, GALLERY_MEDIA_YOUTUBE } from "@/lib/eed-content";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { extractYouTubeVideoId } from "@/lib/youtube";

export type GalleryActionResult =
  | { success: true }
  | { success: false; error: string };

function revalidateGallery() {
  revalidatePath("/admin/gallery");
  revalidatePath("/tawze3a/gallery");
}

function httpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function addGalleryImages(urls: string[]): Promise<GalleryActionResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const imageUrls = urls
    .map((url) => httpsUrl(url))
    .filter((url): url is string => Boolean(url));

  if (imageUrls.length === 0) {
    return { success: false, error: "يرجى رفع صورة أولاً" };
  }

  try {
    for (const url of imageUrls) {
      await prisma.galleryMedia.create({
        data: {
          type: GALLERY_MEDIA_IMAGE,
          url,
        },
      });
    }
  } catch {
    return { success: false, error: "تعذر حفظ الصور. حاول مرة أخرى." };
  }

  revalidateGallery();
  return { success: true };
}

export async function addGalleryYouTube(url: string): Promise<GalleryActionResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const trimmed = url.trim();

  if (!extractYouTubeVideoId(trimmed)) {
    return { success: false, error: "يرجى إدخال رابط يوتيوب صحيح" };
  }

  try {
    await prisma.galleryMedia.create({
      data: {
        type: GALLERY_MEDIA_YOUTUBE,
        url: trimmed,
      },
    });
  } catch {
    return { success: false, error: "تعذر حفظ الفيديو. حاول مرة أخرى." };
  }

  revalidateGallery();
  return { success: true };
}

export async function deleteGalleryMedia(id: string): Promise<GalleryActionResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  try {
    await prisma.galleryMedia.delete({ where: { id } });
  } catch {
    return { success: false, error: "تعذر حذف الوسائط. حاول مرة أخرى." };
  }

  revalidateGallery();
  return { success: true };
}
