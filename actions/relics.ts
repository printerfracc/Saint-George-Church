"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export type RelicActionResult =
  | { success: true }
  | { success: false; error: string };

export type RelicData = {
  name: string;
  description: string;
  imageUrl?: string | null;
};

async function ensureAdmin(): Promise<RelicActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

function parseRelicData(data: RelicData) {
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

function revalidateRelics() {
  revalidatePath("/admin/relics");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function listRelics() {
  try {
    return await prisma.relic.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createRelic(data: RelicData): Promise<RelicActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.relic.create({
      data: parseRelicData(data),
    });
    revalidateRelics();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ بيانات المزار",
    };
  }
}

export async function updateRelic(
  id: string,
  data: RelicData,
): Promise<RelicActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.relic.update({
      where: { id },
      data: parseRelicData(data),
    });
    revalidateRelics();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث بيانات المزار",
    };
  }
}

export async function deleteRelic(id: string): Promise<RelicActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.relic.delete({ where: { id } });
    revalidateRelics();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف المزار" };
  }
}
