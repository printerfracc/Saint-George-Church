"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import {
  cellToString,
  isInvalidNationalId,
  rowValue,
  type Tawze3aExcelRow,
  type Tawze3aImportResult,
} from "@/lib/tawze3a-excel";

async function ensureCategory(khedmaId: string, role: { id: string; name: string }) {
  const existing = await prisma.khedmaCategory.findFirst({
    where: { khedmaId, roleId: role.id },
  });

  if (existing) {
    return existing;
  }

  const maxOrder = await prisma.khedmaCategory.aggregate({
    where: { khedmaId },
    _max: { order: true },
  });

  return prisma.khedmaCategory.create({
    data: {
      khedmaId,
      label: role.name,
      roleId: role.id,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
}

async function upsertServant(nationalId: string, name: string, phone: string | null) {
  try {
    return await prisma.servant.upsert({
      where: { nationalId },
      update: {
        name,
        ...(phone ? { phone } : {}),
      },
      create: { name, phone, nationalId },
    });
  } catch {
    const existing = await prisma.servant.findFirst({
      where: { nationalId },
    });

    if (existing) {
      return prisma.servant.update({
        where: { id: existing.id },
        data: { name },
      });
    }

    return prisma.servant.create({
      data: { name, phone: null, nationalId },
    });
  }
}

function revalidateImportPaths(tawze3aId: string) {
  revalidatePath("/admin/tawze3a");
  revalidatePath(`/admin/tawze3a/${tawze3aId}`);
  revalidatePath("/tawze3a");
  revalidatePath("/tawze3a/login");
  revalidatePath("/admin/servants");
  revalidatePath("/", "layout");
}

export async function processTawze3aRows(
  tawze3aId: string,
  rows: Tawze3aExcelRow[],
): Promise<Tawze3aImportResult> {
  const hasServantNameColumn = rows.some((row) => rowValue(row, "ServantName") != null);

  if (!hasServantNameColumn) {
    return {
      success: false,
      error: "لا توجد صفوف صالحة. تأكد من وجود عمود ServantName على الأقل.",
    };
  }

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const nationalIdRaw = rowValue(row, "ServantNationalID");

    if (!nationalIdRaw || nationalIdRaw === 0 || isInvalidNationalId(nationalIdRaw)) {
      skipped += 1;
      continue;
    }

    const nationalId = cellToString(nationalIdRaw);
    const name = cellToString(rowValue(row, "ServantName"));
    const rawPhone = cellToString(rowValue(row, "ServantPhone"));
    const khedmaName = cellToString(row["5edma"] ?? rowValue(row, "5edma")).trim();
    const roleName = cellToString(row["Role"] ?? rowValue(row, "Role")).trim();
    const phone =
      !rawPhone || rawPhone === "0" || rawPhone.toLowerCase() === "undefined"
        ? null
        : rawPhone;

    if (!name) {
      skipped += 1;
      continue;
    }

    try {
      const servant = await upsertServant(nationalId, name, phone);

      if (!khedmaName || !roleName) {
        imported += 1;
        continue;
      }

      let khedma = await prisma.khedma.findFirst({
        where: { name: khedmaName, tawze3aId },
      });

      if (!khedma) {
        const maxOrder = await prisma.khedma.aggregate({
          where: { tawze3aId },
          _max: { order: true },
        });

        khedma = await prisma.khedma.create({
          data: {
            tawze3aId,
            name: khedmaName,
            order: (maxOrder._max.order ?? -1) + 1,
          },
        });
      }

      let role = await prisma.servantRole.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        role = await prisma.servantRole.create({
          data: { name: roleName },
        });
      }

      const category = await ensureCategory(khedma.id, role);

      const existingAssignment = await prisma.servantAssignment.findFirst({
        where: { servantId: servant.id, khedmaId: khedma.id },
      });

      if (!existingAssignment) {
        await prisma.servantAssignment.create({
          data: {
            servantId: servant.id,
            khedmaId: khedma.id,
            roleId: role.id,
            categoryId: category.id,
          },
        });
      } else if (existingAssignment.roleId !== role.id) {
        await prisma.servantAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            roleId: role.id,
            categoryId: category.id,
          },
        });
      }

      imported += 1;
    } catch (error) {
      failed += 1;
      console.error("Failed to import tawze3a row", { nationalId, name, error });
    }
  }

  if (imported === 0 && failed === 0) {
    return {
      success: false,
      error: "لا توجد صفوف صالحة. تأكد من وجود عمود ServantName على الأقل.",
    };
  }

  revalidateImportPaths(tawze3aId);

  return { success: true, imported, skipped, failed };
}

export async function importTawze3aExcel(formData: FormData): Promise<Tawze3aImportResult> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { success: false, error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  const tawze3aId = cellToString(formData.get("tawze3aId"));
  const file = formData.get("file");

  if (!tawze3aId) {
    return { success: false, error: "تعذر تحديد التوزيعة المطلوب استيرادها" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "يرجى اختيار ملف Excel صالح" };
  }

  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return { success: false, error: "يُسمح فقط بملفات Excel ذات الامتداد xlsx أو xls" };
  }

  const tawze3a = await prisma.tawze3a.findUnique({
    where: { id: tawze3aId },
    select: { id: true },
  });

  if (!tawze3a) {
    return { success: false, error: "التوزيعة غير موجودة" };
  }

  let rows: Tawze3aExcelRow[];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName =
      workbook.SheetNames.find((name) => name.trim().toLowerCase() === "twze3a") ??
      workbook.SheetNames[0];

    if (!sheetName) {
      return { success: false, error: "الملف لا يحتوي على أي ورقة عمل" };
    }

    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Tawze3aExcelRow>(sheet, {
      defval: "",
      raw: false,
    });
  } catch {
    return { success: false, error: "تعذر قراءة ملف Excel. تأكد من صحة الملف ثم حاول مرة أخرى." };
  }

  if (rows.length === 0) {
    return { success: false, error: "لا توجد صفوف في ورقة التوزيعة" };
  }

  return processTawze3aRows(tawze3aId, rows);
}
