import { Workbook, type Alignment, type Borders, type Cell, type Fill, type Font } from "exceljs";

const BORDER: Partial<Borders> = {
  top: { style: "thin", color: { argb: "FFC4B39A" } },
  left: { style: "thin", color: { argb: "FFC4B39A" } },
  bottom: { style: "thin", color: { argb: "FFC4B39A" } },
  right: { style: "thin", color: { argb: "FFC4B39A" } },
};

const TITLE_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF6B1D2A" },
};

const HEADER_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF3E6C4" },
};

const GROUP_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE7D3A1" },
};

const BAND_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFBF7F0" },
};

const TITLE_FONT: Partial<Font> = {
  name: "Arial",
  size: 18,
  bold: true,
  color: { argb: "FFF8F1E3" },
};

const HEADER_FONT: Partial<Font> = {
  name: "Arial",
  size: 12,
  bold: true,
  color: { argb: "FF6B1D2A" },
};

const BODY_FONT: Partial<Font> = {
  name: "Arial",
  size: 11,
  color: { argb: "FF3A241C" },
};

export type ServantSheetColumn = {
  header: string;
  groupTitle: string | null;
  width: number;
  kind: "text" | "id" | "number";
};

function paint(cell: Cell, fill: Fill, font: Partial<Font>, alignment: Partial<Alignment>) {
  cell.fill = fill;
  cell.font = font;
  cell.alignment = alignment;
  cell.border = BORDER;
}

function headerAlignment(wrap = true): Partial<Alignment> {
  return {
    horizontal: "center",
    vertical: "middle",
    wrapText: wrap,
    readingOrder: "rtl",
  };
}

function columnWidth(column: ServantSheetColumn) {
  if (column.kind === "id") {
    return Math.max(column.width, 22);
  }

  if (column.kind === "number") {
    return Math.max(column.width, 12);
  }

  return Math.max(column.width, 14);
}

function wrappedLineCount(text: string, width: number) {
  const capacity = Math.max(8, Math.floor(width * 0.7));

  return text.split(/\r?\n/).reduce((total, line) => {
    const length = [...line].length;
    return total + Math.max(1, Math.ceil(length / capacity));
  }, 0);
}

export async function buildServantExportWorkbook(columns: ServantSheetColumn[], rows: string[][]) {
  const workbook = new Workbook();
  workbook.creator = "كنيسة الشهيد العظيم مارجرجس بالمطرية";
  workbook.title = "كشف الخدام";

  const hasGroups = columns.some((column) => column.groupTitle);
  const headerRows = hasGroups ? 2 : 1;
  const dataStart = headerRows + 2;
  const lastColumn = Math.max(columns.length, 1);
  const widths = columns.map(columnWidth);
  const totalWidth = widths.reduce((total, width) => total + width, 0);
  const pageCapacity = 115;
  const pagesWide = Math.max(1, Math.ceil(totalWidth / pageCapacity));
  const orientation = totalWidth > 80 ? "landscape" : "portrait";

  const worksheet = workbook.addWorksheet("الخدام", {
    views: [
      {
        rightToLeft: true,
        state: "frozen",
        ySplit: dataStart - 1,
        showGridLines: false,
        activeCell: "A1",
      },
    ],
    pageSetup: {
      paperSize: 9,
      orientation,
      fitToPage: true,
      fitToWidth: pagesWide,
      fitToHeight: 0,
      horizontalCentered: true,
      verticalCentered: false,
      printTitlesRow: `1:${dataStart - 1}`,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.7,
        bottom: 0.6,
        header: 0.25,
        footer: 0.25,
      },
    },
    headerFooter: {
      oddHeader: '&C&"Arial,Bold"&10كشف الخدام',
      oddFooter:
        '&R&"Arial"&9كنيسة الشهيد العظيم مارجرجس بالمطرية&C&"Arial"&9صفحة &P من &N&L&"Arial"&9عدد الخدام: ' +
        String(rows.length),
    },
  });

  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = pagesWide;
  worksheet.pageSetup.fitToHeight = 0;
  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = orientation;
  if (columns.length > 6) {
    worksheet.pageSetup.printTitlesColumn = "A:A";
  }
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  worksheet.mergeCells(1, 1, 1, lastColumn);
  const title = worksheet.getCell(1, 1);
  title.value = "كشف الخدام";
  paint(title, TITLE_FILL, TITLE_FONT, headerAlignment(false));
  for (let column = 1; column <= lastColumn; column += 1) {
    paint(worksheet.getCell(1, column), TITLE_FILL, TITLE_FONT, headerAlignment(false));
  }
  worksheet.getRow(1).height = 34;

  let columnIndex = 1;
  while (columnIndex <= columns.length) {
    const column = columns[columnIndex - 1];

    if (!column.groupTitle) {
      if (hasGroups) {
        worksheet.mergeCells(2, columnIndex, 3, columnIndex);
      }
      paint(worksheet.getCell(2, columnIndex), HEADER_FILL, HEADER_FONT, headerAlignment());
      worksheet.getCell(2, columnIndex).value = column.header;
      if (hasGroups) {
        paint(worksheet.getCell(3, columnIndex), HEADER_FILL, HEADER_FONT, headerAlignment());
      }
      columnIndex += 1;
      continue;
    }

    let end = columnIndex;
    while (end <= columns.length && columns[end - 1]?.groupTitle === column.groupTitle) {
      end += 1;
    }

    worksheet.mergeCells(2, columnIndex, 2, end - 1);
    for (let index = columnIndex; index < end; index += 1) {
      paint(worksheet.getCell(2, index), GROUP_FILL, HEADER_FONT, headerAlignment());
      const part = worksheet.getCell(3, index);
      part.value = columns[index - 1]?.header ?? "";
      paint(part, HEADER_FILL, HEADER_FONT, headerAlignment());
    }
    worksheet.getCell(2, columnIndex).value = column.groupTitle;
    columnIndex = end;
  }

  worksheet.getRow(2).height = hasGroups ? 24 : 28;
  if (hasGroups) {
    worksheet.getRow(3).height = 22;
  }

  rows.forEach((row, rowIndex) => {
    const excelRow = worksheet.getRow(dataStart + rowIndex);
    const band = rowIndex % 2 === 1;
    let lines = 1;

    columns.forEach((column, index) => {
      const cell = excelRow.getCell(index + 1);
      const value = row[index]?.trim() ? row[index] : "—";
      cell.font = BODY_FONT;
      cell.border = BORDER;
      if (band) {
        cell.fill = BAND_FILL;
      }

      if (column.kind === "id") {
        cell.numFmt = "@";
        cell.value = value;
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: false,
          shrinkToFit: true,
          readingOrder: "ltr",
        };
      } else if (column.kind === "number") {
        cell.value = value;
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: false,
          readingOrder: "ltr",
        };
      } else {
        cell.value = value;
        cell.alignment = {
          horizontal: "right",
          vertical: "middle",
          wrapText: true,
          readingOrder: "rtl",
        };
        lines = Math.max(lines, wrappedLineCount(value, widths[index] ?? 20));
      }
    });

    excelRow.height = Math.min(180, Math.max(22, lines * 18));
  });

  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  if (rows.length === 0) {
    const empty = worksheet.getRow(dataStart);
    worksheet.mergeCells(dataStart, 1, dataStart, lastColumn);
    empty.getCell(1).value = "لا توجد بيانات";
    empty.height = 24;
    columns.forEach((_column, index) => {
      paint(empty.getCell(index + 1), BAND_FILL, BODY_FONT, headerAlignment(false));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
