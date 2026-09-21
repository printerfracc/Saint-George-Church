export type Tawze3aImportResult =
  | {
      success: true;
      imported: number;
      skipped: number;
      failed: number;
    }
  | { success: false; error: string };

export type Tawze3aExcelRow = {
  ServantName?: unknown;
  ServantPhone?: unknown;
  ServantNationalID?: unknown;
  Role?: unknown;
  "5edma"?: unknown;
  [key: string]: unknown;
};

export function cellToString(value: unknown) {
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

export function rowValue(row: Tawze3aExcelRow, key: string) {
  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return row[key];
  }

  const wanted = key.replace(/\s+/g, "").toLowerCase();

  for (const [header, value] of Object.entries(row)) {
    if (header.replace(/^\uFEFF/, "").replace(/\s+/g, "").toLowerCase() === wanted) {
      return value;
    }
  }

  return undefined;
}

export function isInvalidNationalId(value: unknown) {
  if (value == null || value === "" || value === 0) {
    return true;
  }

  const text = cellToString(value);
  return !text || text === "0" || text.toLowerCase() === "undefined" || text.toLowerCase() === "null";
}
