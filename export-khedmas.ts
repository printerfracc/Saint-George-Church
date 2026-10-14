// Run with: npx tsx export-khedmas.ts

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Workbook, type Borders, type Cell, type Margins } from "exceljs";
import { readServantContact } from "./lib/crypto";
import { normalizeArabic } from "./lib/arabicNormalizer";
import { roleDisplayIndex } from "./lib/servant-role-order";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const OUTPUT_DIR = path.join(process.cwd(), "Khedma_Exports");

const ROLE_ORDER = ["أمين", "أمينة", "نائب أمين", "نائبة أمينة", "خادم", "خادمة"] as const;

const THIN_BORDER: Partial<Borders> = {
  top: { style: "thin", color: { argb: "FFC4B39A" } },
  left: { style: "thin", color: { argb: "FFC4B39A" } },
  bottom: { style: "thin", color: { argb: "FFC4B39A" } },
  right: { style: "thin", color: { argb: "FFC4B39A" } },
};

const NARROW_MARGINS: Margins = {
  left: 0.25,
  right: 0.25,
  top: 0.75,
  bottom: 0.75,
  header: 0.3,
  footer: 0.3,
};

type RosterRow = {
  name: string;
  phone: string | null;
  role: string;
};

function roleKey(name: string) {
  return normalizeArabic(name).replace(/ئ/g, "ي").replace(/\s+/g, " ").trim();
}

function hasWord(key: string, word: string) {
  return key.split(" ").some((item) => item === word || item.startsWith(word));
}

function assignmentRoleRank(name: string) {
  const key = roleKey(name);
  const deputy = key.includes("ناي");
  const secretary = key.includes("امين");
  const servant = hasWord(key, "خادم");

  if (key.includes("موقوف") || key.includes("غير مسجل") || key.includes("مساعد")) {
    return ROLE_ORDER.length;
  }

  if (secretary && !deputy) {
    return hasWord(key, "امينه") ? 1 : 0;
  }

  if (deputy && secretary) {
    return hasWord(key, "نايبه") || hasWord(key, "امينه") ? 3 : 2;
  }

  if (servant) {
    return hasWord(key, "خادمه") ? 5 : 4;
  }

  return ROLE_ORDER.length;
}

function sanitizeFileName(name: string) {
  const sanitized = name
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  return sanitized || "khedma";
}

function formatPhone(phone: string | null) {
  const value = phone?.trim();
  return value ? value : "—";
}

function applyBorder(cell: Cell) {
  cell.border = THIN_BORDER;
}

function sortRoster(rows: RosterRow[]) {
  return [...rows].sort((left, right) => {
    const rank = assignmentRoleRank(left.role) - assignmentRoleRank(right.role);
    if (rank !== 0) {
      return rank;
    }

    const display = roleDisplayIndex(left.role) - roleDisplayIndex(right.role);
    if (display !== 0) {
      return display;
    }

    return left.name.localeCompare(right.name, "ar");
  });
}

async function buildWorkbook(khedmaName: string, rows: RosterRow[]) {
  const workbook = new Workbook();
  workbook.creator = "Saint George Church";

  const worksheet = workbook.addWorksheet("الخدام", {
    views: [{ rightToLeft: true, state: "normal", showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: NARROW_MARGINS,
    },
  });

  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;
  worksheet.pageSetup.printTitlesRow = "1:2";

  worksheet.columns = [{ width: 40 }, { width: 20 }, { width: 20 }];

  worksheet.mergeCells("A1:C1");
  const title = worksheet.getCell("A1");
  title.value = khedmaName;
  title.font = { name: "Arial", size: 20, bold: true, color: { argb: "FF6B1D2A" } };
  title.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
    readingOrder: "rtl",
  };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8F1E3" },
  };
  worksheet.getRow(1).height = 42;

  for (const column of ["A", "B", "C"] as const) {
    const cell = worksheet.getCell(`${column}1`);
    cell.fill = title.fill;
    applyBorder(cell);
  }

  const headers = ["الاسم", "رقم الموبايل", "الرتبة"] as const;
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(2, index + 1);
    cell.value = header;
    cell.font = { name: "Arial", size: 13, bold: true, color: { argb: "FF6B1D2A" } };
    cell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3E6C4" },
    };
    applyBorder(cell);
  });
  worksheet.getRow(2).height = 26;

  rows.forEach((row, index) => {
    const excelRow = worksheet.getRow(index + 3);
    const nameCell = excelRow.getCell(1);
    const phoneCell = excelRow.getCell(2);
    const roleCell = excelRow.getCell(3);

    nameCell.value = row.name;
    nameCell.alignment = {
      horizontal: "right",
      vertical: "middle",
      wrapText: true,
      readingOrder: "rtl",
    };

    phoneCell.value = formatPhone(row.phone);
    phoneCell.numFmt = "@";
    phoneCell.alignment = { horizontal: "center", vertical: "middle" };

    roleCell.value = row.role;
    roleCell.alignment = { horizontal: "center", vertical: "middle", readingOrder: "rtl" };

    for (const cell of [nameCell, phoneCell, roleCell]) {
      cell.font = { name: "Arial", size: 12 };
      applyBorder(cell);
    }

    excelRow.height = 22;
  });

  return workbook;
}

function uniqueFilePath(usedNames: Map<string, number>, khedmaName: string) {
  const base = sanitizeFileName(khedmaName);
  const key = base.toLocaleLowerCase("ar");
  const seen = usedNames.get(key) ?? 0;
  usedNames.set(key, seen + 1);
  const fileName = seen === 0 ? `${base}.xlsx` : `${base}-${seen + 1}.xlsx`;
  return path.join(OUTPUT_DIR, fileName);
}

async function exportKhedmas() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local or .env.");
  }

  const { prisma } = await import("./lib/prisma");
  const { getCurrentActiveYear } = await import("./lib/tawze3a-year");

  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const year = await getCurrentActiveYear();
    const khedmas = await prisma.khedma.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        assignments: {
          where: { year, isDraft: false },
          include: {
            servant: { select: { name: true, encryptedPhone: true } },
            role: { select: { name: true } },
          },
        },
        categories: {
          include: {
            assignments: {
              where: { year, isDraft: false, khedmaId: null },
              include: {
                servant: { select: { name: true, encryptedPhone: true } },
                role: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const usedNames = new Map<string, number>();
    let exported = 0;
    let skipped = 0;

    for (const khedma of khedmas) {
      const rows = sortRoster([
        ...khedma.assignments.map((assignment) => ({
          name: assignment.servant.name,
          phone: readServantContact(assignment.servant).phone,
          role: assignment.role.name,
        })),
        ...khedma.categories.flatMap((category) =>
          category.assignments.map((assignment) => ({
            name: assignment.servant.name,
            phone: readServantContact(assignment.servant).phone,
            role: assignment.role.name,
          })),
        ),
      ]);

      if (rows.length === 0) {
        skipped += 1;
        continue;
      }

      const workbook = await buildWorkbook(khedma.name, rows);
      const filePath = uniqueFilePath(usedNames, khedma.name);
      await workbook.xlsx.writeFile(filePath);
      exported += 1;
      console.log(`${khedma.name}: ${rows.length} → ${path.basename(filePath)}`);
    }

    console.log(`Active year: ${year}`);
    console.log(`Exported ${exported} khedma files to ${OUTPUT_DIR}`);
    console.log(`Skipped ${skipped} khedmas with no servants.`);
  } finally {
    await prisma.$disconnect();
  }
}

exportKhedmas().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Export failed: ${message}`);
  process.exitCode = 1;
});
