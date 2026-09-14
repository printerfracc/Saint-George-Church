"use server";

import { revalidatePath } from "next/cache";
import { isHomeSectionKey } from "@/lib/content";
import {
  listDynamicContent,
  saveDynamicContent,
} from "@/lib/dynamic-content";
import { requireAdmin } from "@/lib/require-admin";

export type ContentActionResult =
  | { success: true }
  | { success: false; error: string };

export type ContentData = {
  title: string;
  content: string;
  imageUrl?: string | null;
};

async function ensureAdmin(): Promise<ContentActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

function parseContentData(sectionKey: string, data: ContentData) {
  if (!isHomeSectionKey(sectionKey)) {
    throw new Error("مفتاح القسم غير صالح");
  }

  const title = data.title.trim();
  const content = data.content.trim();
  const imageUrl = data.imageUrl?.trim() || null;

  if (!title) {
    throw new Error("يرجى إدخال عنوان القسم");
  }

  return { sectionKey, title, content, imageUrl };
}

export async function listContent() {
  try {
    return await listDynamicContent();
  } catch {
    return [];
  }
}

export async function upsertContent(
  sectionKey: string,
  data: ContentData,
): Promise<ContentActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    const parsed = parseContentData(sectionKey, data);
    await saveDynamicContent(parsed);

    revalidatePath("/admin/content");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/history");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ المحتوى",
    };
  }
}
