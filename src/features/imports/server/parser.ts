import * as XLSX from "xlsx";
import type { ParsedWorkbook } from "@/features/imports/server/types";

function normalizeCell(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}

export function parseImportFile(
  buffer: Buffer,
  filename: string,
): ParsedWorkbook {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { headers: [], rows: [] };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const sheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  const headers =
    sheetData.length > 0
      ? Object.keys(sheetData[0]).map((header) => header.trim())
      : [];

  const rows = sheetData.map((row) => {
    const mappedRow: Record<string, string | null> = {};

    Object.entries(row).forEach(([key, value]) => {
      mappedRow[key.trim()] = normalizeCell(value);
    });

    return mappedRow;
  });

  if (headers.length === 0 && filename.toLowerCase().endsWith(".csv")) {
    const csvSheet = workbook.Sheets[firstSheetName];
    const csvRows = XLSX.utils.sheet_to_json<string[]>(csvSheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });

    const fallbackHeaders = (csvRows[0] ?? []).map((header) => header.trim());
    const fallbackRows = csvRows.slice(1).map((values) => {
      const row: Record<string, string | null> = {};

      fallbackHeaders.forEach((header, index) => {
        row[header] = normalizeCell(values[index] ?? null);
      });

      return row;
    });

    return {
      headers: fallbackHeaders,
      rows: fallbackRows,
    };
  }

  return { headers, rows };
}

