"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTawze3aAdmin } from "@/lib/require-admin";

function assertYear(year: number, label: string) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error(`${label} غير صالحة`);
  }
}

export async function cloneYear(sourceYear: number, targetYear: number) {
  const session = await requireTawze3aAdmin();

  if (!session) {
    throw new Error("غير مصرح لك بتنفيذ هذه العملية");
  }

  assertYear(sourceYear, "سنة المصدر");
  assertYear(targetYear, "سنة الهدف");

  if (sourceYear === targetYear) {
    throw new Error("سنة المصدر وسنة الهدف يجب أن تكونا مختلفتين");
  }

  const records = await prisma.servantAssignment.findMany({
    where: { year: sourceYear },
  });

  if (records.length === 0) {
    throw new Error("لا توجد تعيينات في سنة المصدر");
  }

  const existingTarget = await prisma.servantAssignment.count({
    where: { year: targetYear },
  });

  if (existingTarget > 0) {
    throw new Error("سنة الهدف تحتوي بالفعل على تعيينات");
  }

  const drafts = records.map((record) => ({
    categoryId: record.categoryId,
    khedmaId: record.khedmaId,
    servantId: record.servantId,
    roleId: record.roleId,
    year: targetYear,
    isDraft: true,
  }));

  await prisma.servantAssignment.createMany({ data: drafts });

  revalidatePath("/admin/tawze3a");
  revalidatePath("/admin/servants");
  revalidatePath("/tawze3a");

  return { count: drafts.length };
}
