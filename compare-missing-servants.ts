import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

type ExcelServant = {
  name: string;
  phone: string;
  nationalId: string;
};

type ImportRow = {
  name: string;
  phone: string;
  nationalId: string;
  khedma: string;
  role: string;
};

type AssignedServant = {
  name: string;
  phone: string | null;
  nationalId: string | null;
  assignments: { id: string }[];
};

const IMPORT_HEADERS = ["ServantName", "ServantPhone", "ServantNationalID", "5edma", "Role"] as const;
const FALLBACK_ROLE = "خادم";

function cellToString(value: unknown) {
  if (value == null) {
    return "";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }

    return String(Math.trunc(value));
  }

  return String(value).trim();
}

function readSheetRows(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' was not found in 6 Oct.xlsx`);
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
}

function readExcelServants(workbook: XLSX.WorkBook) {
  return readSheetRows(workbook, "Servants")
    .map((row) => ({
      name: cellToString(row.Name),
      phone: cellToString(row.Phone),
      nationalId: cellToString(row.NationalID),
    }))
    .filter((row) => row.name || row.phone || row.nationalId);
}

function readTwze3aRows(workbook: XLSX.WorkBook): ImportRow[] {
  return readSheetRows(workbook, "Twze3a")
    .map((row) => ({
      name: cellToString(row.ServantName),
      phone: cellToString(row.ServantPhone),
      nationalId: cellToString(row.ServantNationalID),
      khedma: cellToString(row["5edma"]),
      role: cellToString(row.Role),
    }))
    .filter((row) => row.name || row.phone || row.nationalId);
}

function filled(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

function sameFilledValue(left: string | null | undefined, right: string | null | undefined) {
  const a = filled(left);
  const b = filled(right);
  return a !== null && a === b;
}

function matchesAssignedServant(excel: ExcelServant, assigned: AssignedServant) {
  return (
    sameFilledValue(assigned.phone, excel.phone) ||
    sameFilledValue(assigned.nationalId, excel.nationalId) ||
    sameFilledValue(assigned.name, excel.name)
  );
}

function importRowKey(row: ImportRow) {
  return [row.name, row.phone, row.nationalId, row.khedma, row.role].join("|");
}

function writeImportWorkbook(rows: ImportRow[], outputPath: string) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...IMPORT_HEADERS],
    ...rows.map((row) => [row.name, row.phone, row.nationalId, row.khedma, row.role]),
  ]);

  for (let rowIndex = 1; rowIndex <= rows.length; rowIndex += 1) {
    for (const columnIndex of [1, 2]) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[address];

      if (!cell) {
        continue;
      }

      cell.t = "s";
      cell.v = String(cell.v ?? "");
      cell.z = "@";
    }
  }

  worksheet["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 18 }, { wch: 28 }, { wch: 28 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Twze3a");
  XLSX.writeFile(workbook, outputPath);
}

function buildImportRows(missing: ExcelServant[], twze3aRows: ImportRow[]) {
  const covered = new Set<number>();
  const seenImportRows = new Set<string>();
  const importRows: ImportRow[] = [];

  for (const row of twze3aRows) {
    const matchIndex = missing.findIndex(
      (servant) =>
        sameFilledValue(servant.phone, row.phone) ||
        sameFilledValue(servant.nationalId, row.nationalId) ||
        sameFilledValue(servant.name, row.name),
    );

    if (matchIndex === -1) {
      continue;
    }

    const servant = missing[matchIndex];
    const importRow: ImportRow = {
      name: row.name || servant.name,
      phone: row.phone || servant.phone,
      nationalId: row.nationalId || servant.nationalId,
      khedma: row.khedma,
      role: row.role || FALLBACK_ROLE,
    };
    const key = importRowKey(importRow);

    if (seenImportRows.has(key)) {
      covered.add(matchIndex);
      continue;
    }

    seenImportRows.add(key);
    importRows.push(importRow);
    covered.add(matchIndex);
  }

  for (const [index, row] of missing.entries()) {
    if (covered.has(index) || !row.name) {
      continue;
    }

    importRows.push({
      name: row.name,
      phone: row.phone,
      nationalId: row.nationalId,
      khedma: "",
      role: FALLBACK_ROLE,
    });
  }

  return importRows;
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  const excelPath = path.join(process.cwd(), "6 Oct.xlsx");
  const workbook = XLSX.readFile(excelPath);
  const excelServants = readExcelServants(workbook);
  const twze3aRows = readTwze3aRows(workbook);
  const { prisma } = await import("./lib/prisma");

  try {
    const servants = await prisma.servant.findMany({
      include: {
        assignments: true,
      },
    });
    const assigned = servants.filter((servant) => servant.assignments.length > 0);
    const missing = excelServants.filter(
      (row) => !assigned.some((servant) => matchesAssignedServant(row, servant)),
    );
    const lines = missing.map(
      (row) => `Name: ${row.name} | Phone: ${row.phone} | NID: ${row.nationalId}`,
    );
    const textPath = path.join(process.cwd(), "missing_servants.txt");
    const workbookPath = path.join(process.cwd(), "missing_servants.xlsx");
    const importRows = buildImportRows(missing, twze3aRows);

    fs.writeFileSync(textPath, lines.length > 0 ? `${lines.join("\n")}\n` : "", "utf8");
    writeImportWorkbook(importRows, workbookPath);

    console.log(`Excel servants: ${excelServants.length}`);
    console.log(`Database servants: ${servants.length}`);
    console.log(`Assigned servants: ${assigned.length}`);
    console.log(`Missing servants: ${missing.length}`);
    console.log(`Wrote ${textPath}`);
    console.log(`Wrote ${workbookPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
