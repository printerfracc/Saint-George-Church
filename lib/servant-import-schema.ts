import { z } from "zod";
import {
  cellToString,
  rowValue,
  type Tawze3aExcelRow,
} from "@/lib/tawze3a-excel";

export const SERVANT_IMPORT_CHUNK_SIZE = 50;

export const SERVANT_NAME_COLUMNS = ["ServantName", "الاسم (Name)", "Name"];
export const SERVANT_ROLE_COLUMNS = ["Role", "الرتبة"];

const PHONE_COLUMNS = ["ServantPhone", "رقم الموبايل (Phone)", "Phone", "mobilePhone"];
const NATIONAL_ID_COLUMNS = [
  "ServantNationalID",
  "الرقم القومي (NationalID)",
  "NationalID",
  "nationalId",
];
const KHEDMA_COLUMNS = ["5edma", "اسم الخدمة", "Khedma", "khedma"];

function normalizeOptionalText(value: string | null | undefined, treatZeroAsEmpty = false) {
  const text = value?.trim() ?? "";

  if (!text || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
    return null;
  }

  if (treatZeroAsEmpty && text === "0") {
    return null;
  }

  return text;
}

function optionalNullableString(treatZeroAsEmpty = false) {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => normalizeOptionalText(value, treatZeroAsEmpty));
}

export const servantImportRowSchema = z.object({
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  mobilePhone: optionalNullableString(true),
  nationalId: optionalNullableString(true),
  khedmaId: optionalNullableString(true),
  khedmas: z
    .array(z.string().trim())
    .optional()
    .nullable()
    .transform((value) => {
      if (!value?.length) {
        return null;
      }

      const names = value
        .map((item) => normalizeOptionalText(item, true))
        .filter((item): item is string => Boolean(item));

      return names.length > 0 ? names : null;
    }),
});

export const servantImportRequestSchema = z.object({
  rows: z.array(z.unknown()).min(1).max(SERVANT_IMPORT_CHUNK_SIZE),
});

export type ServantImportRow = z.infer<typeof servantImportRowSchema>;

export type ServantImportPayload = {
  name: string;
  role: string;
  mobilePhone: string | null;
  nationalId: string | null;
  khedmaId: string | null;
  khedmas: string[] | null;
};

export function columnExists(rows: Tawze3aExcelRow[], columns: string[]) {
  return rows.some((row) => columns.some((column) => rowValue(row, column) !== undefined));
}

function firstCell(row: Tawze3aExcelRow, columns: string[]) {
  for (const column of columns) {
    const value = rowValue(row, column);

    if (value !== undefined) {
      return cellToString(value);
    }
  }

  return "";
}

function isFilledText(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return Boolean(text) && text !== "0" && text.toLowerCase() !== "undefined" && text.toLowerCase() !== "null";
}

export function excelRowToImportPayload(row: Tawze3aExcelRow): ServantImportPayload {
  const khedma = firstCell(row, KHEDMA_COLUMNS);

  return {
    name: firstCell(row, SERVANT_NAME_COLUMNS),
    role: firstCell(row, SERVANT_ROLE_COLUMNS),
    mobilePhone: firstCell(row, PHONE_COLUMNS) || null,
    nationalId: firstCell(row, NATIONAL_ID_COLUMNS) || null,
    khedmaId: null,
    khedmas: khedma ? [khedma] : null,
  };
}

export function isImportableServantRow(row: ServantImportPayload) {
  return isFilledText(row.name) && isFilledText(row.role);
}
