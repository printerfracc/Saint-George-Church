// Run with: npx tsx scripts/import-servants-form.ts

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import * as XLSX from "xlsx";
import type { PrismaClient } from "@prisma/client";
import {
  hashForLookup,
  nationalIdSecretFields,
  phoneSecretFields,
} from "../lib/crypto";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

type ExtraField =
  | "address"
  | "bloodType"
  | "emergencyContact"
  | "graduationYear"
  | "jobOrStudy"
  | "previousKhedmas"
  | "deaconRank"
  | "extraNotes";

type SheetField = ExtraField | "name" | "phone" | "nationalId" | "khedma" | "photo";

type ColumnMap = Partial<Record<SheetField, number>>;

type SheetRow = {
  excelRow: number;
  name: string | null;
  phone: string | null;
  nationalId: string | null;
  nationalIdUnreadable: boolean;
  khedma: string | null;
  address: string | null;
  bloodType: string | null;
  emergencyContact: string | null;
  graduationYear: string | null;
  jobOrStudy: string | null;
  previousKhedmas: string | null;
  deaconRank: string | null;
  extraNotes: string | null;
};

type ServantMatch = {
  id: string;
  name: string;
  phoneHash: string | null;
  nationalIdHash: string | null;
};

const HEADER_MATCHERS: { field: SheetField; test: (header: string) => boolean }[] = [
  { field: "name", test: (header) => header.includes("الاسم") },
  { field: "address", test: (header) => header.includes("عنوان المنزل") },
  { field: "phone", test: (header) => header.includes("تليفون") || header.includes("موبايل") },
  { field: "nationalId", test: (header) => header.includes("الرقم القومي") || header.includes("قومي") },
  { field: "jobOrStudy", test: (header) => header.includes("المهنة") || header.includes("الدراسة") },
  { field: "previousKhedmas", test: (header) => header.includes("الخدمات السابقة") },
  { field: "khedma", test: (header) => header.includes("الخدمة") },
  { field: "graduationYear", test: (header) => header.includes("سنة التخرج") },
  { field: "photo", test: (header) => header.includes("صورة") },
  { field: "bloodType", test: (header) => header.includes("فصيلة الدم") },
  {
    field: "emergencyContact",
    test: (header) => header.includes("حالات الطوارئ") && !header.includes("فصيلة"),
  },
  { field: "extraNotes", test: (header) => header.includes("ملاحظات") },
  { field: "deaconRank", test: (header) => header.includes("الرتبة الشماسية") },
];

export function normalizeEasternArabicNumerals(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String(EASTERN_ARABIC_DIGITS.indexOf(digit)));
}

function stripInvisibleMarks(value: string) {
  return value.replace(/[\u200e\u200f\u202a-\u202e\ufeff]/g, "");
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

function resolveWorkbookPath() {
  const candidates = [
    path.join(process.cwd(), "servants-data.xlsx"),
    path.join(process.cwd(), "servants-data..xlsx"),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new Error("Could not find servants-data.xlsx in the project root.");
  }

  return found;
}

function headerMap(sheet: XLSX.WorkSheet) {
  const ref = sheet["!ref"];

  if (!ref) {
    throw new Error("The workbook sheet is empty.");
  }

  const range = XLSX.utils.decode_range(ref);
  const columns: ColumnMap = {};

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const header = readCellText(sheet[XLSX.utils.encode_cell({ r: range.s.r, c: column })]);
    const matcher = HEADER_MATCHERS.find((item) => item.test(header));

    if (matcher && columns[matcher.field] == null) {
      columns[matcher.field] = column;
    }
  }

  for (const field of ["name", "phone", "nationalId"] as const) {
    if (columns[field] == null) {
      throw new Error(`The sheet is missing the ${field} column.`);
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

function textField(sheet: XLSX.WorkSheet, row: number, column: number | undefined) {
  return blankToNull(readCellText(cellAt(sheet, row, column)));
}

function readRows(sheet: XLSX.WorkSheet, columns: ColumnMap, range: XLSX.Range) {
  const rows: SheetRow[] = [];

  for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
    const nationalId = readNationalId(cellAt(sheet, row, columns.nationalId));
    const parsed: SheetRow = {
      excelRow: row + 1,
      name: textField(sheet, row, columns.name),
      phone: normalizePhone(readCellText(cellAt(sheet, row, columns.phone))),
      nationalId: nationalId.value,
      nationalIdUnreadable: nationalId.unreadable,
      khedma: textField(sheet, row, columns.khedma),
      address: textField(sheet, row, columns.address),
      bloodType: textField(sheet, row, columns.bloodType),
      emergencyContact: textField(sheet, row, columns.emergencyContact),
      graduationYear: textField(sheet, row, columns.graduationYear),
      jobOrStudy: textField(sheet, row, columns.jobOrStudy),
      previousKhedmas: textField(sheet, row, columns.previousKhedmas),
      deaconRank: textField(sheet, row, columns.deaconRank),
      extraNotes: textField(sheet, row, columns.extraNotes),
    };

    const hasContent = Object.entries(parsed).some(([key, value]) => {
      return key !== "excelRow" && key !== "nationalIdUnreadable" && value;
    });

    if (hasContent) {
      rows.push(parsed);
    }
  }

  return rows;
}

function extraData(row: SheetRow, includeEmergencyContact: boolean) {
  return {
    address: row.address,
    bloodType: row.bloodType,
    graduationYear: row.graduationYear,
    jobOrStudy: row.jobOrStudy,
    previousKhedmas: row.previousKhedmas,
    deaconRank: row.deaconRank,
    extraNotes: row.extraNotes,
    ...(includeEmergencyContact ? { emergencyContact: row.emergencyContact } : {}),
  };
}

function rowDetails(row: SheetRow) {
  return {
    row: row.excelRow,
    name: row.name,
    phone: row.phone,
    nationalId: row.nationalId,
    khedma: row.khedma,
  };
}

type ConflictReportEntry = {
  row: number;
  name: string | null;
  phone: string | null;
  nationalId: string | null;
  reason: string;
};

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function conflictReportCsv(report: ConflictReportEntry[]) {
  const header = ["Row", "Name", "Phone", "National ID", "Reason"].map(csvCell).join(",");
  const lines = report.map((entry) =>
    [
      entry.row,
      entry.name,
      entry.phone ? `\t${entry.phone}` : "",
      entry.nationalId ? `\t${entry.nationalId}` : "",
      entry.reason,
    ]
      .map(csvCell)
      .join(","),
  );

  return `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
}

function logConflict(row: SheetRow, message: string, extra?: unknown) {
  console.error(`CONFLICT row ${row.excelRow}: ${message}`);
  console.error(JSON.stringify({ ...rowDetails(row), ...(extra ? { details: extra } : {}) }, null, 2));
}

function describeMatches(
  matches: ServantMatch[],
  phoneHash: string | null,
  nationalIdHash: string | null,
) {
  return matches.map((servant) => ({
    id: servant.id,
    name: servant.name,
    phoneMatched: Boolean(phoneHash && servant.phoneHash === phoneHash),
    nationalIdMatched: Boolean(nationalIdHash && servant.nationalIdHash === nationalIdHash),
  }));
}

function conflictMessage(
  matches: ReturnType<typeof describeMatches>,
  phone: string | null,
  nationalId: string | null,
) {
  const phoneHits = matches.filter((match) => match.phoneMatched);
  const idHits = matches.filter((match) => match.nationalIdMatched);

  if (phoneHits.length > 0 && idHits.length > 0 && phoneHits[0]?.id !== idHits[0]?.id) {
    return `phone matched "${phoneHits[0]?.name}" (${phoneHits[0]?.id}) but national ID matched a different servant "${idHits[0]?.name}" (${idHits[0]?.id})`;
  }

  if (phoneHits.length > 0 && idHits.length === 0) {
    const found = phoneHits.map((match) => `"${match.name}" (${match.id})`).join(", ");
    const idState = nationalId ? "the national ID was not found in the database" : "the sheet has no national ID";
    return `phone matched ${found}, but ${idState}`;
  }

  if (idHits.length > 0 && phoneHits.length === 0) {
    const found = idHits.map((match) => `"${match.name}" (${match.id})`).join(", ");
    const phoneState = phone ? "the phone was not found in the database" : "the sheet has no phone";
    return `national ID matched ${found}, but ${phoneState}`;
  }

  if (matches.length > 0) {
    const found = matches.map((match) => `"${match.name}" (${match.id})`).join(", ");
    return `matched ${found}, but phone and national ID did not both match one servant`;
  }

  return "the row could not be matched safely";
}

async function findMatches(prisma: PrismaClient, phoneHash: string | null, nationalIdHash: string | null) {
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

export function loadServantFormRows(workbookPath = resolveWorkbookPath()) {
  const workbook = XLSX.readFile(workbookPath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;

  if (!sheet || !sheetName) {
    throw new Error("The workbook has no sheets.");
  }

  const { columns, range } = headerMap(sheet);

  return {
    workbookPath,
    sheetName,
    columns,
    rows: readRows(sheet, columns, range),
  };
}

async function importServants() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!process.env.APP_ENCRYPTION_KEY?.trim()) {
    throw new Error("APP_ENCRYPTION_KEY is not set");
  }

  const { workbookPath, sheetName, columns, rows } = loadServantFormRows();
  const includeEmergencyContact = columns.emergencyContact != null;
  const { prisma } = await import("../lib/prisma");

  let updated = 0;
  let created = 0;
  let conflicts = 0;
  const conflictReport: ConflictReportEntry[] = [];

  console.log(`Reading ${rows.length} rows from ${path.basename(workbookPath)} / ${sheetName}`);
  console.log(`Photo column ${columns.photo == null ? "was not found" : "was found and will be skipped"}.`);

  try {
    for (const row of rows) {
      try {
        if (row.nationalIdUnreadable) {
          conflicts += 1;
          logConflict(
            row,
            "national ID cell could not be read as an exact digit string and would have become scientific notation",
          );
          continue;
        }

        if (!row.name) {
          conflicts += 1;
          logConflict(row, "the row has no name");
          continue;
        }

        const phoneHash = row.phone ? hashForLookup(row.phone) : null;
        const nationalIdHash = row.nationalId ? hashForLookup(row.nationalId) : null;

        if (!phoneHash && !nationalIdHash) {
          conflicts += 1;
          logConflict(row, "the row has neither a phone nor a national ID");
          continue;
        }

        const matches = await findMatches(prisma, phoneHash, nationalIdHash);
        const described = describeMatches(matches, phoneHash, nationalIdHash);
        const perfectMatch =
          matches.length === 1 &&
          phoneHash != null &&
          nationalIdHash != null &&
          matches[0]?.phoneHash === phoneHash &&
          matches[0]?.nationalIdHash === nationalIdHash;

        if (perfectMatch && matches[0]) {
          await prisma.servant.update({
            where: { id: matches[0].id },
            data: extraData(row, includeEmergencyContact),
          });
          updated += 1;
          continue;
        }

        if (matches.length === 0) {
          await prisma.servant.create({
            data: {
              name: row.name,
              ...phoneSecretFields(row.phone),
              ...nationalIdSecretFields(row.nationalId),
              ...extraData(row, includeEmergencyContact),
            },
          });
          created += 1;
          continue;
        }

        conflicts += 1;
        const reason = conflictMessage(described, row.phone, row.nationalId);
        conflictReport.push({
          row: row.excelRow,
          name: row.name,
          phone: row.phone,
          nationalId: row.nationalId,
          reason,
        });
        logConflict(row, reason, described);
      } catch (error) {
        conflicts += 1;
        const message = error instanceof Error ? error.message : String(error);
        logConflict(row, message);
      }
    }
  } finally {
    const csvString = conflictReportCsv(conflictReport);
    fs.writeFileSync("conflicts-report.csv", csvString);
    console.log("Check conflicts-report.csv");
    await prisma.$disconnect();
  }

  console.log(`${updated} Updated, ${created} Created, ${conflicts} Conflicts.`);
}

const entry = process.argv[1];

if (entry && import.meta.url === pathToFileURL(path.resolve(entry)).href) {
  importServants().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Import failed: ${message}`);
    process.exitCode = 1;
  });
}
