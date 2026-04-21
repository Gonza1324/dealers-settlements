import type { ImportTemplateColumn } from "@/features/imports/types";

export interface StructureValidationResult {
  isValid: boolean;
  criticalErrors: string[];
  warnings: string[];
}

export function validateImportHeaders(
  headers: string[],
  columnSchema: ImportTemplateColumn[],
): StructureValidationResult {
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
  const expected = columnSchema.map((column) => ({
    ...column,
    normalizedName: column.name.trim().toLowerCase(),
  }));

  const missingRequired = expected
    .filter(
      (column) =>
        column.required && !normalizedHeaders.includes(column.normalizedName),
    )
    .map((column) => column.name);

  const unexpectedHeaders = headers.filter(
    (header) =>
      !expected.some(
        (column) => column.normalizedName === header.trim().toLowerCase(),
      ),
  );

  const criticalErrors = [];

  if (missingRequired.length > 0) {
    criticalErrors.push(
      `Missing required columns: ${missingRequired.join(", ")}.`,
    );
  }

  if (headers.length === 0) {
    criticalErrors.push("The file does not contain a readable header row.");
  }

  return {
    isValid: criticalErrors.length === 0,
    criticalErrors,
    warnings:
      unexpectedHeaders.length > 0
        ? [`Unexpected columns will be ignored: ${unexpectedHeaders.join(", ")}.`]
        : [],
  };
}

