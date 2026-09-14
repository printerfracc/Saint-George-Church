"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export type ActivityActionResult =
  | { success: true }
  | { success: false; error: string };

export type ActivityData = {
  name: string;
  description: string;
  imageUrl?: string | null;
};

async function ensureAdmin(): Promise<ActivityActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

function parseActivityData(data: ActivityData) {
  const name = data.name.trim();
  const description = data.description.trim();
  const imageUrl = data.imageUrl?.trim() || null;

  if (!name) {
    throw new Error("يرجى إدخال الاسم");
  }

  if (!description) {
    throw new Error("يرجى إدخال الوصف");
  }

  return { name, description, imageUrl };
}

function revalidateActivities() {
  revalidatePath("/admin/activities");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function listActivities() {
  try {
    return await prisma.churchActivity.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createActivity(
  data: ActivityData,
): Promise<ActivityActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.churchActivity.create({
      data: parseActivityData(data),
    });
    revalidateActivities();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ بيانات النشاط",
    };
  }
}

export async function updateActivity(
  id: string,
  data: ActivityData,
): Promise<ActivityActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.churchActivity.update({
      where: { id },
      data: parseActivityData(data),
    });
    revalidateActivities();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث بيانات النشاط",
    };
  }
}

export async function deleteActivity(id: string): Promise<ActivityActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.churchActivity.delete({ where: { id } });
    revalidateActivities();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف النشاط" };
  }
}
