// Run with: npx tsx scripts/resolve-conflicts.ts

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import * as XLSX from "xlsx";
import type { PrismaClient } from "@prisma/client";
import { encryptData, hashForLookup } from "../lib/crypto";
import { loadServantFormRows } from "./import-servants-form";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

type ConflictField = "row" | "name" | "phone" | "nationalId" | "reason";
type ColumnMap = Partial<Record<ConflictField, number>>;

type ConflictRow = {
  row: number;
  name: string | null;
  phone: string | null;
  nationalId: string | null;
  nationalIdUnreadable: boolean;
};

type LeftoverConflict = {
  row: number;
  name: string | null;
  phone: string | null;
  nationalId: string | null;
  reason: string;
};

type ServantMatch = {
  id: string;
  name: string;
  phoneHash: string | null;
  nationalIdHash: string | null;
};

const HEADER_MATCHERS: { field: ConflictField; test: (header: string) => boolean }[] = [
  { field: "row", test: (header) => header === "row" || header.includes("صف") },
  { field: "name", test: (header) => header === "name" || header.includes("اسم") },
  { field: "phone", test: (header) => header.includes("phone") || header.includes("تليفون") || header.includes("موبايل") },
  { field: "nationalId", test: (header) => header.includes("national") || header.includes("قومي") },
  { field: "reason", test: (header) => header === "reason" || header.includes("سبب") },
];

function normalizeEasternArabicNumerals(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String(EASTERN_ARABIC_DIGITS.indexOf(digit)));
}

function stripInvisibleMarks(value: string) {
  return value.replace(/[\u200e\u200f\u202a-\u202e\ufeff]/g, "").replace(/^[\t']+/, "");
}

function blankToNull(value: string) {
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function isScientificNotation(value: string) {
  return /e[+-]\d+/i.test(value);
}

function exactIntegerString(value: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value);

  if (!Number.isSafeInteger(rounded)) {
    return null;
  }

  return rounded.toFixed(0);
}

function readCellText(cell: XLSX.CellObject | undefined) {
  if (!cell || cell.v == null) {
    return "";
  }

  if (cell.t === "n" && typeof cell.v === "number") {
    const formatted = cell.w?.trim() ?? "";

    if (formatted && !isScientificNotation(formatted)) {
      return formatted;
    }

    return exactIntegerString(cell.v) ?? formatted;
  }

  const formatted = (cell.w ?? String(cell.v)).trim();

  if (isScientificNotation(formatted) && typeof cell.v === "number") {
    return exactIntegerString(cell.v) ?? "";
  }

  return formatted;
}

function normalizePhone(raw: string) {
  const normalized = normalizeEasternArabicNumerals(stripInvisibleMarks(raw)).trim();

  if (!normalized) {
    return null;
  }

  if (/^1\d{9}$/.test(normalized)) {
    return `0${normalized}`;
  }

  return normalized;
}

function normalizeNationalId(raw: string) {
  const normalized = normalizeEasternArabicNumerals(stripInvisibleMarks(raw)).replace(/\s+/g, "");

  if (!normalized || isScientificNotation(normalized)) {
    return null;
  }

  return normalized;
}

function readNationalId(cell: XLSX.CellObject | undefined) {
  if (!cell || cell.v == null || cell.v === "") {
    return { value: null, unreadable: false };
  }

  if (cell.t === "n" && typeof cell.v === "number") {
    const formatted = cell.w?.trim() ?? "";

    if (formatted && !isScientificNotation(formatted)) {
      return { value: normalizeNationalId(formatted), unreadable: false };
    }

    const exact = exactIntegerString(cell.v);

    if (!exact) {
      return { value: null, unreadable: true };
    }

    return { value: normalizeNationalId(exact), unreadable: false };
  }

  const text = readCellText(cell);
  const value = normalizeNationalId(text);

  if (!value && isScientificNotation(text)) {
    return { value: null, unreadable: true };
  }

  return { value, unreadable: false };
}

function resolveConflictsPath() {
  const workbookPath = path.join(process.cwd(), "conflicts-report.xlsx");
  const csvPath = path.join(process.cwd(), "conflicts-report.csv");

  if (fs.existsSync(workbookPath)) {
    return workbookPath;
  }

  if (fs.existsSync(csvPath)) {
    return csvPath;
  }

  throw new Error("Could not find conflicts-report.csv or conflicts-report.xlsx");
}

function headerMap(sheet: XLSX.WorkSheet) {
  const ref = sheet["!ref"];

  if (!ref) {
    throw new Error("The conflicts file is empty.");
  }

  const range = XLSX.utils.decode_range(ref);
  const columns: ColumnMap = {};

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const header = readCellText(sheet[XLSX.utils.encode_cell({ r: range.s.r, c: column })])
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase();
    const matcher = HEADER_MATCHERS.find((item) => item.test(header));

    if (matcher && columns[matcher.field] == null) {
      columns[matcher.field] = column;
    }
  }

  for (const field of ["row", "name", "phone", "nationalId"] as const) {
    if (columns[field] == null) {
      throw new Error(`The conflicts file is missing the ${field} column.`);
    }
  }

  return { columns, range };
}

function cellAt(sheet: XLSX.WorkSheet, row: number, column: number | undefined) {
  if (column == null) {
    return undefined;
  }

  return sheet[XLSX.utils.encode_cell({ r: row, c: column })] as XLSX.CellObject | undefined;
}

function readConflictRows(filePath: string) {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;

  if (!sheet || !sheetName) {
    throw new Error("The conflicts file has no sheets.");
  }

  const { columns, range } = headerMap(sheet);
  const rows: ConflictRow[] = [];

  for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
    const rowNumber = Number.parseInt(readCellText(cellAt(sheet, row, columns.row)), 10);
    const nationalId = readNationalId(cellAt(sheet, row, columns.nationalId));
    const parsed: ConflictRow = {
      row: rowNumber,
      name: blankToNull(readCellText(cellAt(sheet, row, columns.name))),
      phone: normalizePhone(readCellText(cellAt(sheet, row, columns.phone))),
      nationalId: nationalId.value,
      nationalIdUnreadable: nationalId.unreadable,
    };

    if (!Number.isInteger(rowNumber) || (!parsed.name && !parsed.phone && !parsed.nationalId)) {
      continue;
    }

    rows.push(parsed);
  }

  return { filePath, sheetName, rows };
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function leftoverCsv(report: LeftoverConflict[]) {
  const header = ["Row", "Name", "Phone", "National ID", "Reason"].map(csvCell).join(",");
  const lines = report.map((entry) =>
    [entry.row, entry.name, entry.phone ? `\t${entry.phone}` : "", entry.nationalId ? `\t${entry.nationalId}` : "", entry.reason]
      .map(csvCell)
      .join(","),
  );

  return `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
}

function crossMatchReason(matches: ServantMatch[], phoneHash: string | null, nationalIdHash: string | null) {
  const phoneMatch = matches.find((servant) => phoneHash && servant.phoneHash === phoneHash);
  const idMatch = matches.find((servant) => nationalIdHash && servant.nationalIdHash === nationalIdHash);

  if (phoneMatch && idMatch && phoneMatch.id !== idMatch.id) {
    return `Phone matched ${phoneMatch.name}, ID matched ${idMatch.name}`;
  }

  const names = matches.map((servant) => servant.name).join(", ");
  return `Phone and national ID matched ${matches.length} different servants: ${names}`;
}

async function findServants(prisma: PrismaClient, phoneHash: string | null, nationalIdHash: string | null) {
  const filters: Array<{ phoneHash: string } | { nationalIdHash: string }> = [];

  if (phoneHash) {
    filters.push({ phoneHash });
  }

  if (nationalIdHash) {
    filters.push({ nationalIdHash });
  }

  if (filters.length === 0) {
    return [];
  }

  return prisma.servant.findMany({
    where: { OR: filters },
    select: {
      id: true,
      name: true,
      phoneHash: true,
      nationalIdHash: true,
    },
  });
}

async function resolveConflicts() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!process.env.APP_ENCRYPTION_KEY?.trim()) {
    throw new Error("APP_ENCRYPTION_KEY is not set");
  }

  const source = readConflictRows(resolveConflictsPath());
  const formRows = new Map(loadServantFormRows().rows.map((row) => [row.excelRow, row]));
  const { prisma } = await import("../lib/prisma");
  const leftoverConflicts: LeftoverConflict[] = [];
  let resolved = 0;

  console.log(`Reading ${source.rows.length} conflict rows from ${path.basename(source.filePath)}`);

  try {
    for (const row of source.rows) {
      if (row.nationalIdUnreadable) {
        leftoverConflicts.push({
          row: row.row,
          name: row.name,
          phone: row.phone,
          nationalId: row.nationalId,
          reason: "National ID could not be read as an exact digit string",
        });
        continue;
      }

      const phoneHash = row.phone ? hashForLookup(row.phone) : null;
      const nationalIdHash = row.nationalId ? hashForLookup(row.nationalId) : null;

      if (!phoneHash && !nationalIdHash) {
        leftoverConflicts.push({
          row: row.row,
          name: row.name,
          phone: row.phone,
          nationalId: row.nationalId,
          reason: "No servant matched this phone or national ID",
        });
        continue;
      }

      try {
        const servants = await findServants(prisma, phoneHash, nationalIdHash);
        const form = formRows.get(row.row);

        if (servants.length === 1 && servants[0]) {
          await prisma.servant.update({
            where: { id: servants[0].id },
            data: {
              ...(row.phone
                ? { encryptedPhone: encryptData(row.phone), phoneHash: hashForLookup(row.phone) }
                : {}),
              ...(row.nationalId
                ? {
                    encryptedNationalId: encryptData(row.nationalId),
                    nationalIdHash: hashForLookup(row.nationalId),
                  }
                : {}),
              address: form?.address ?? null,
              bloodType: form?.bloodType ?? null,
              graduationYear: form?.graduationYear ?? null,
              jobOrStudy: form?.jobOrStudy ?? null,
              previousKhedmas: form?.previousKhedmas ?? null,
              deaconRank: form?.deaconRank ?? null,
              extraNotes: form?.extraNotes ?? null,
            },
          });
          resolved += 1;
          continue;
        }

        if (servants.length > 1) {
          leftoverConflicts.push({
            row: row.row,
            name: row.name,
            phone: row.phone,
            nationalId: row.nationalId,
            reason: crossMatchReason(servants, phoneHash, nationalIdHash),
          });
          continue;
        }

        leftoverConflicts.push({
          row: row.row,
          name: row.name,
          phone: row.phone,
          nationalId: row.nationalId,
          reason: "No servant matched this phone or national ID",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        leftoverConflicts.push({
          row: row.row,
          name: row.name,
          phone: row.phone,
          nationalId: row.nationalId,
          reason: message,
        });
      }
    }
  } finally {
    if (leftoverConflicts.length > 0) {
      const csvOutput = leftoverCsv(leftoverConflicts);
      fs.writeFileSync("leftover-conflicts.csv", csvOutput);
    }

    await prisma.$disconnect();
  }

  console.log(
    `${resolved} Conflicts Resolved (Updated). ${leftoverConflicts.length} True Conflicts saved to leftover-conflicts.csv`,
  );
}

const entry = process.argv[1];

if (entry && import.meta.url === pathToFileURL(path.resolve(entry)).href) {
  resolveConflicts().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Resolve failed: ${message}`);
    process.exitCode = 1;
  });
}
