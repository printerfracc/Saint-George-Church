"use server";

import { revalidatePath } from "next/cache";
import { isAdminLiturgySection } from "@/lib/liturgies";
import { parseOptionalHref } from "@/lib/link-button";
import {
  createLiturgyRecord,
  deleteLiturgyRecord,
  listLiturgyRecords,
  saveLiturgyLinkFields,
  updateLiturgyRecord,
} from "@/lib/liturgy-db";
import { requireAdmin } from "@/lib/require-admin";

export type LiturgyActionResult =
  | { success: true }
  | { success: false; error: string };

export type LiturgyEntryData = {
  section: string;
  title?: string | null;
  description?: string | null;
  detail?: string | null;
  imageUrl?: string | null;
  link?: string | null;
  linkLabel?: string | null;
};

async function ensureAdmin(): Promise<LiturgyActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

function parseLiturgyData(data: LiturgyEntryData) {
  if (!isAdminLiturgySection(data.section)) {
    throw new Error("قسم الصلوات غير صالح");
  }

  const isSchedule = data.section === "SCHEDULE";
  const isRites = data.section === "RITES";
  const title = data.title?.trim() ?? "";
  const description = isSchedule ? "" : (data.description?.trim() ?? "");
  const detail = data.detail?.trim() || null;
  const imageUrl = isSchedule ? null : data.imageUrl?.trim() || null;
  const link = isRites ? parseOptionalHref(data.link) : null;
  const linkLabel = link ? data.linkLabel?.trim() || null : null;

  if (isSchedule) {
    if (!title && !detail) {
      throw new Error("يرجى إدخال اسم القداس أو الموعد");
    }
  } else if (!title && !description && !detail && !imageUrl && !link) {
    throw new Error("يرجى إدخال حقل واحد على الأقل");
  }

  return {
    record: {
      section: data.section,
      title,
      description,
      detail,
      imageUrl,
    },
    linkFields: { link, linkLabel },
  };
}

function revalidateLiturgies() {
  revalidatePath("/admin/liturgies");
  revalidatePath("/admin");
  revalidatePath("/liturgies");
}

export async function listLiturgyEntries() {
  try {
    return await listLiturgyRecords();
  } catch {
    return [];
  }
}

export async function createLiturgyEntry(
  data: LiturgyEntryData,
): Promise<LiturgyActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    const parsed = parseLiturgyData(data);
    const created = await createLiturgyRecord(parsed.record);
    await saveLiturgyLinkFields(created.id, parsed.linkFields);
    revalidateLiturgies();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ عنصر الصلوات",
    };
  }
}

export async function updateLiturgyEntry(
  id: string,
  data: LiturgyEntryData,
): Promise<LiturgyActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    const parsed = parseLiturgyData(data);
    await updateLiturgyRecord(id, parsed.record);
    await saveLiturgyLinkFields(id, parsed.linkFields);
    revalidateLiturgies();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث عنصر الصلوات",
    };
  }
}

export async function deleteLiturgyEntry(
  id: string,
): Promise<LiturgyActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await deleteLiturgyRecord(id);
    revalidateLiturgies();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف العنصر" };
  }
}
