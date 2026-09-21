"use server";

import { revalidatePath } from "next/cache";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import { wipeTawze3aStructure } from "@/lib/tawze3a-wipe";

export async function deleteAllTawze3aData(): Promise<
  { success: true } | { success: false; error: string }
> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { success: false, error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  try {
    await wipeTawze3aStructure();

    revalidatePath("/admin/servants");
    revalidatePath("/admin/tawze3a");
    revalidatePath("/tawze3a");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("deleteAllTawze3aData failed", error);
    return { success: false, error: "تعذر مسح بيانات التوزيعة حالياً. حاول مرة أخرى." };
  }
}
