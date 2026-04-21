import { resolveAssignmentMatch } from "@/features/imports/server/matching";
import type {
  DealerFinancierAssignmentLookup,
  FinancierAliasLookup,
  NormalizedImportPayload,
  NormalizedImportRow,
} from "@/features/imports/server/types";
import type { ImportIssue, ImportRowUpdatePayload } from "@/features/imports/types";

function normalizeText(value: string | null) {
  return value
    ?.trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s/-]/g, "")
    .toLowerCase() ?? null;
}

function parseNumeric(value: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = value.replace(/[$,\s]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | number | null) {
  const parsed = parseNumeric(value);

  return parsed === null ? null : Math.trunc(parsed);
}

function normalizeString(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function buildExactDuplicateKey(payload: NormalizedImportPayload) {
  return [
    payload.periodMonth,
    payload.vinValue,
    payload.yearValue,
    payload.makeValue,
    payload.modelValue,
    payload.saleValue,
    payload.financeNormalized,
    payload.netGrossValue,
    payload.pickupValue,
  ]
    .map((value) => String(value ?? ""))
    .join("|");
}

function buildPossibleDuplicateKey(payload: NormalizedImportPayload) {
  return [
    payload.periodMonth,
    payload.vinValue,
    payload.yearValue,
    payload.makeValue,
    payload.modelValue,
    payload.saleValue,
  ]
    .map((value) => String(value ?? ""))
    .join("|");
}

export function normalizeFinancierAlias(value: string) {
  return normalizeText(value) ?? "";
}

export function validateNormalizedPayload(
  payload: Pick<
    NormalizedImportPayload,
    | "yearValue"
    | "makeValue"
    | "modelValue"
    | "vinValue"
    | "saleValue"
    | "financeRaw"
    | "netGrossValue"
    | "pickupValue"
  >,
) {
  const validationErrors: ImportIssue[] = [];

  if (!payload.yearValue) {
    validationErrors.push({
      code: "invalid_year",
      message: "Year is missing or invalid.",
      field: "yearValue",
      severity: "error",
    });
  }

  if (!payload.makeValue) {
    validationErrors.push({
      code: "missing_make",
      message: "Make is required.",
      field: "makeValue",
      severity: "error",
    });
  }

  if (!payload.modelValue) {
    validationErrors.push({
      code: "missing_model",
      message: "Model is required.",
      field: "modelValue",
      severity: "error",
    });
  }

  if (!payload.vinValue) {
    validationErrors.push({
      code: "missing_vin",
      message: "VIN is required.",
      field: "vinValue",
      severity: "error",
    });
  }

  if (payload.saleValue === null) {
    validationErrors.push({
      code: "invalid_sale",
      message: "Sale is missing or invalid.",
      field: "saleValue",
      severity: "error",
    });
  }

  if (!payload.financeRaw) {
    validationErrors.push({
      code: "missing_finance",
      message: "Finance is required.",
      field: "financeRaw",
      severity: "error",
    });
  }

  if (payload.netGrossValue === null) {
    validationErrors.push({
      code: "invalid_net_gross",
      message: "Net Gross is missing or invalid.",
      field: "netGrossValue",
      severity: "error",
    });
  }

  if (payload.pickupValue < 0) {
    validationErrors.push({
      code: "invalid_pick_up",
      message: "Pick Up cannot be negative.",
      field: "pickupValue",
      severity: "error",
    });
  }

  return validationErrors;
}

export function buildNormalizedPayload(params: {
  values: {
    periodMonth: string;
    yearValue: number | null;
    makeValue: string | null;
    modelValue: string | null;
    vinValue: string | null;
    saleValue: number | null;
    financeRaw: string | null;
    netGrossValue: number | null;
    pickupValue: number | null;
  };
  financierAliases: FinancierAliasLookup[];
  assignments: DealerFinancierAssignmentLookup[];
}) {
  const financeRaw = normalizeString(params.values.financeRaw);
  const financeNormalized = financeRaw ? normalizeFinancierAlias(financeRaw) : null;

  const matching = resolveAssignmentMatch({
    financeNormalized,
    periodMonth: params.values.periodMonth,
    financierAliases: params.financierAliases,
    assignments: params.assignments,
  });

  const payload: NormalizedImportPayload = {
    periodMonth: params.values.periodMonth,
    yearValue: params.values.yearValue,
    makeValue: normalizeString(params.values.makeValue),
    modelValue: normalizeString(params.values.modelValue),
    vinValue: normalizeString(params.values.vinValue)?.toUpperCase() ?? null,
    saleValue: params.values.saleValue,
    financeRaw,
    financeNormalized,
    netGrossValue: params.values.netGrossValue,
    pickupValue: params.values.pickupValue ?? 0,
    assignedFinancierId: matching.detectedFinancierId,
    assignedFinancierName: matching.detectedFinancierName,
    assignedDealerId: matching.detectedDealerId,
    assignedDealerName: matching.detectedDealerName,
  };

  return {
    normalizedPayload: payload,
    validationErrors: validateNormalizedPayload(payload),
    warnings: matching.warnings,
    detectedFinancierId: matching.detectedFinancierId,
    detectedFinancierName: matching.detectedFinancierName,
    detectedDealerId: matching.detectedDealerId,
    detectedDealerName: matching.detectedDealerName,
    exactDuplicateKey: buildExactDuplicateKey(payload),
    possibleDuplicateKey: buildPossibleDuplicateKey(payload),
  };
}

export function normalizeImportRows(params: {
  rows: Record<string, string | null>[];
  financierAliases: FinancierAliasLookup[];
  assignments: DealerFinancierAssignmentLookup[];
  periodMonth: string;
}): NormalizedImportRow[] {
  return params.rows.map((row, index) => {
    const built = buildNormalizedPayload({
      values: {
        periodMonth: params.periodMonth,
        yearValue: parseInteger(row["Year"] ?? null),
        makeValue: row["Make"] ?? null,
        modelValue: row["Model"] ?? null,
        vinValue: row["VIN"] ?? null,
        saleValue: parseNumeric(row["Sale"] ?? null),
        financeRaw: row["Finance"] ?? null,
        netGrossValue: parseNumeric(row["Net Gross"] ?? null),
        pickupValue: parseNumeric(row["Pick Up"] ?? null) ?? 0,
      },
      financierAliases: params.financierAliases,
      assignments: params.assignments,
    });

    return {
      rowNumber: index + 2,
      originalPayload: row,
      normalizedPayload: built.normalizedPayload,
      validationErrors: built.validationErrors,
      warnings: built.warnings,
      detectedFinancierId: built.detectedFinancierId,
      detectedFinancierName: built.detectedFinancierName,
      detectedDealerId: built.detectedDealerId,
      detectedDealerName: built.detectedDealerName,
      exactDuplicateKey: built.exactDuplicateKey,
      possibleDuplicateKey: built.possibleDuplicateKey,
    };
  });
}

export function normalizeEditedRow(params: {
  currentRow: Record<string, unknown>;
  payload: ImportRowUpdatePayload;
  periodMonth: string;
  financierAliases: FinancierAliasLookup[];
  assignments: DealerFinancierAssignmentLookup[];
}) {
  const originalPayload =
    (params.currentRow.raw_payload as Record<string, string | null>) ?? {};

  const updatedOriginalPayload = {
    ...originalPayload,
    Year:
      params.payload.yearValue === null ? null : String(params.payload.yearValue),
    Make: params.payload.makeValue || null,
    Model: params.payload.modelValue || null,
    VIN: params.payload.vinValue || null,
    Sale:
      params.payload.saleValue === null ? null : String(params.payload.saleValue),
    Finance: params.payload.financeRaw || null,
    "Net Gross":
      params.payload.netGrossValue === null
        ? null
        : String(params.payload.netGrossValue),
    "Pick Up":
      params.payload.pickupValue === null ? null : String(params.payload.pickupValue),
  };

  const built = buildNormalizedPayload({
    values: {
      periodMonth: params.periodMonth,
      yearValue: params.payload.yearValue,
      makeValue: params.payload.makeValue,
      modelValue: params.payload.modelValue,
      vinValue: params.payload.vinValue,
      saleValue: params.payload.saleValue,
      financeRaw: params.payload.financeRaw,
      netGrossValue: params.payload.netGrossValue,
      pickupValue: params.payload.pickupValue ?? 0,
    },
    financierAliases: params.financierAliases,
    assignments: params.assignments,
  });

  return {
    originalPayload: updatedOriginalPayload,
    ...built,
  };
}
