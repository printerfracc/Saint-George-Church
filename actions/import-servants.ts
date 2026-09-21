"use server";

import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processTawze3aRows } from "@/actions/tawze3a-import";
import type { Tawze3aExcelRow } from "@/lib/tawze3a-excel";

export type UploadServantsResult =
  | { error: string }
  | { count: number };

export async function uploadServantsExcel(
  formData: FormData,
): Promise<UploadServantsResult> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "يرجى اختيار ملف Excel صالح" };
  }

  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return { error: "يُسمح فقط بملفات Excel ذات الامتداد xlsx أو xls" };
  }

  let rows: Tawze3aExcelRow[];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName =
      workbook.SheetNames.find((name) => name.trim().toLowerCase() === "twze3a") ??
      workbook.SheetNames[0];

    if (!sheetName) {
      return { error: "الملف لا يحتوي على أي ورقة عمل" };
    }

    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Tawze3aExcelRow>(sheet, {
      defval: "",
      raw: false,
    });
  } catch {
    return { error: "تعذر قراءة ملف Excel. تأكد من صحة الملف ثم حاول مرة أخرى." };
  }

  let tawze3a = await prisma.tawze3a.findFirst({
    orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });

  if (!tawze3a) {
    tawze3a = await prisma.tawze3a.create({
      data: { title: "توزيعة الخدام", isPublished: false },
      select: { id: true },
    });
  }

  const result = await processTawze3aRows(tawze3a.id, rows);

  if (!result.success) {
    return { error: result.error };
  }

  return { count: result.imported };
}
