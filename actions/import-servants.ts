"use server";

import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UploadServantsResult =
  | { error: string }
  | { count: number };

type ServantExcelRow = {
  Name?: unknown;
  Phone?: unknown;
  NationalID?: unknown;
  Status?: unknown;
  NewUser?: unknown;
};

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

  let rows: ServantExcelRow[];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return { error: "الملف لا يحتوي على أي ورقة عمل" };
    }

    const sheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json<ServantExcelRow>(sheet);
  } catch {
    return { error: "تعذر قراءة ملف Excel. تأكد من صحة الملف ثم حاول مرة أخرى." };
  }

  const mappedData = rows.map((row) => ({
    name: row.Name,
    phone: String(row.Phone),
    nationalId: String(row.NationalID),
    status: row.Status,
    newUser: Boolean(row.NewUser),
  }));

  const uniqueByPhone = new Map<
    string,
    {
      name: string;
      phone: string | null;
      nationalId: string | null;
      status: string | null;
      newUser: boolean;
    }
  >();
  const withoutPhone: Array<{
    name: string;
    phone: string | null;
    nationalId: string | null;
    status: string | null;
    newUser: boolean;
  }> = [];

  for (const row of mappedData) {
    const name = String(row.name ?? "").trim();
    const rawPhone = String(row.phone ?? "").trim();
    const rawNationalId = String(row.nationalId ?? "").trim();
    const phone =
      !rawPhone || rawPhone === "undefined" || rawPhone === "null" ? null : rawPhone;
    const nationalId =
      !rawNationalId || rawNationalId === "undefined" || rawNationalId === "null"
        ? null
        : rawNationalId;

    if (!name) {
      continue;
    }

    const record = {
      name,
      phone,
      nationalId,
      status:
        row.status == null || String(row.status).trim() === ""
          ? null
          : String(row.status),
      newUser: row.newUser,
    };

    if (phone) {
      uniqueByPhone.set(phone, record);
    } else {
      withoutPhone.push(record);
    }
  }

  const data = [...uniqueByPhone.values(), ...withoutPhone];

  if (data.length === 0) {
    return { error: "لا توجد صفوف صالحة. تأكد من وجود عمود Name على الأقل." };
  }

  try {
    const result = await prisma.servant.createMany({
      data,
      skipDuplicates: true,
    });

    return { count: result.count };
  } catch {
    return { error: "تعذر حفظ بيانات الخدام حالياً. حاول مرة أخرى." };
  }
}
