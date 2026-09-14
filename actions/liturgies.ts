"use server";

import { revalidatePath } from "next/cache";
import { isAdminLiturgySection } from "@/lib/liturgies";
import {
  createLiturgyRecord,
  deleteLiturgyRecord,
  listLiturgyRecords,
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
  const title = data.title?.trim() ?? "";
  const description = isSchedule ? "" : (data.description?.trim() ?? "");
  const detail = data.detail?.trim() || null;
  const imageUrl = isSchedule ? null : data.imageUrl?.trim() || null;

  if (isSchedule) {
    if (!title && !detail) {
      throw new Error("يرجى إدخال اسم القداس أو الموعد");
    }
  } else if (!title && !description && !detail && !imageUrl) {
    throw new Error("يرجى إدخال حقل واحد على الأقل");
  }

  return {
    section: data.section,
    title,
    description,
    detail,
    imageUrl,
  };
}

function revalidateLiturgies() {
  revalidatePath("/admin/liturgies");
  revalidatePath("/admin");
  revalidatePath("/liturgies");
  revalidatePath("/prayers");
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
    await createLiturgyRecord(parseLiturgyData(data));
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
    await updateLiturgyRecord(id, parseLiturgyData(data));
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
