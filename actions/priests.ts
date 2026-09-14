"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export type PriestActionResult =
  | { success: true }
  | { success: false; error: string };

export type PriestData = {
  name: string;
  ordinationDate: string;
  confessionSchedule: string;
  cloudinaryImageUrl?: string | null;
  bio?: string | null;
  contactNumbers?: string | null;
};

async function ensureAdmin(): Promise<PriestActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

function parsePriestData(data: PriestData) {
  const name = data.name.trim();
  const confessionSchedule = data.confessionSchedule.trim();
  const cloudinaryImageUrl = data.cloudinaryImageUrl?.trim() || null;
  const bio = data.bio?.trim() || null;
  const contactNumbers = data.contactNumbers?.trim() || null;
  const ordinationDate = new Date(data.ordinationDate);

  if (!name) {
    throw new Error("يرجى إدخال اسم الكاهن");
  }

  if (Number.isNaN(ordinationDate.getTime())) {
    throw new Error("تاريخ الرسامة غير صالح");
  }

  if (!confessionSchedule) {
    throw new Error("يرجى إدخال مواعيد الاعترافات");
  }

  return {
    name,
    ordinationDate,
    confessionSchedule,
    cloudinaryImageUrl,
    bio,
    contactNumbers,
  };
}

function revalidatePriests() {
  revalidatePath("/admin/priests");
  revalidatePath("/admin");
  revalidatePath("/priests");
  revalidatePath("/");
}

export async function listPriests() {
  try {
    return await prisma.priest.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createPriest(data: PriestData): Promise<PriestActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.priest.create({
      data: parsePriestData(data),
    });
    revalidatePriests();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ بيانات الكاهن",
    };
  }
}

export async function updatePriest(
  id: string,
  data: PriestData,
): Promise<PriestActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.priest.update({
      where: { id },
      data: parsePriestData(data),
    });
    revalidatePriests();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث بيانات الكاهن",
    };
  }
}

export async function deletePriest(id: string): Promise<PriestActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.priest.delete({ where: { id } });
    revalidatePriests();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف الكاهن" };
  }
}
