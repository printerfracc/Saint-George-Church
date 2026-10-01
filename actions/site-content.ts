"use server";

import { revalidatePath } from "next/cache";
import { EED_EL_KHODAM_CONTENT_ID } from "@/lib/eed-content";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export type SiteContentActionResult =
  | { success: true }
  | { success: false; error: string };

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export async function upsertEedContent(input: {
  goal: string;
  slogan: string;
}): Promise<SiteContentActionResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const goal = optionalText(input.goal);
  const slogan = optionalText(input.slogan);

  try {
    await prisma.siteContent.upsert({
      where: { id: EED_EL_KHODAM_CONTENT_ID },
      create: {
        id: EED_EL_KHODAM_CONTENT_ID,
        goal,
        slogan,
      },
      update: { goal, slogan },
    });
  } catch {
    return { success: false, error: "تعذر حفظ المحتوى. حاول مرة أخرى." };
  }

  revalidatePath("/admin/eed-content");
  revalidatePath("/tawze3a");
  revalidatePath("/tawze3a/login");

  return { success: true };
}
