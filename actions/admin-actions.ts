"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import {
  createServiceRecord,
  deleteServiceRecord,
  listServiceRecords,
  updateServiceRecord,
} from "@/lib/service-db";

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

async function ensureAdmin(): Promise<AdminActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

function requiredText(value: FormDataEntryValue | string | null, label: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(`يرجى إدخال ${label}`);
  }

  return text;
}

function optionalText(value: FormDataEntryValue | string | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function requiredDate(value: FormDataEntryValue | string | null, label: string) {
  const text = requiredText(value, label);
  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`تاريخ ${label} غير صالح`);
  }

  return date;
}

function revalidateAdmin() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/priests");
  revalidatePath("/admin/services");
  revalidatePath("/admin/news");
  revalidatePath("/admin/sermons");
  revalidatePath("/sectors");
  revalidatePath("/services");
}

function parseServiceData(data: {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}) {
  const title = data.title?.trim() ?? "";
  const description = data.description?.trim() ?? "";
  const imageUrl = data.imageUrl?.trim() || null;

  if (!title) {
    throw new Error("يرجى إدخال اسم القطاع");
  }

  return { title, description, imageUrl };
}

export async function listServices() {
  try {
    return await listServiceRecords();
  } catch {
    return [];
  }
}

export async function createService(data: {
  title: string;
  description: string;
  imageUrl?: string | null;
}): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await createServiceRecord(parseServiceData(data));
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ القطاع",
    };
  }
}

export async function updateService(
  id: string,
  data: {
    title: string;
    description: string;
    imageUrl?: string | null;
  },
): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await updateServiceRecord(id, parseServiceData(data));
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث القطاع",
    };
  }
}

export async function deleteService(id: string): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await deleteServiceRecord(id);
    revalidateAdmin();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف القطاع" };
  }
}

export async function listNewsEvents() {
  try {
    return await prisma.newsEvent.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createNewsEvent(
  formData: FormData,
): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.newsEvent.create({
      data: {
        title: requiredText(formData.get("title"), "العنوان"),
        description: requiredText(formData.get("description"), "الوصف"),
        imageUrl: optionalText(formData.get("imageUrl")),
        isActive: formData.get("isActive") === "true",
      },
    });
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ الخبر",
    };
  }
}

export async function updateNewsEvent(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.newsEvent.update({
      where: { id },
      data: {
        title: requiredText(formData.get("title"), "العنوان"),
        description: requiredText(formData.get("description"), "الوصف"),
        imageUrl: optionalText(formData.get("imageUrl")),
        isActive: formData.get("isActive") === "true",
      },
    });
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث الخبر",
    };
  }
}

export async function deleteNewsEvent(id: string): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.newsEvent.delete({ where: { id } });
    revalidateAdmin();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف الخبر" };
  }
}

export async function listSermons() {
  try {
    return await prisma.sermon.findMany({
      include: { priest: true },
      orderBy: { date: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createSermon(formData: FormData): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.sermon.create({
      data: {
        title: requiredText(formData.get("title"), "عنوان العظة"),
        mediaUrl: requiredText(formData.get("mediaUrl"), "رابط الوسائط"),
        date: requiredDate(formData.get("date"), "تاريخ العظة"),
        priestId: requiredText(formData.get("priestId"), "الكاهن"),
      },
    });
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ العظة",
    };
  }
}

export async function updateSermon(
  id: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.sermon.update({
      where: { id },
      data: {
        title: requiredText(formData.get("title"), "عنوان العظة"),
        mediaUrl: requiredText(formData.get("mediaUrl"), "رابط الوسائط"),
        date: requiredDate(formData.get("date"), "تاريخ العظة"),
        priestId: requiredText(formData.get("priestId"), "الكاهن"),
      },
    });
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث العظة",
    };
  }
}

export async function deleteSermon(id: string): Promise<AdminActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.sermon.delete({ where: { id } });
    revalidateAdmin();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف العظة" };
  }
}
