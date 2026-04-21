import type {
  DealerFinancierAssignmentLookup,
  FinancierAliasLookup,
  NormalizedImportRow,
} from "@/features/imports/server/types";

function normalizeText(value: string | null) {
  return value
    ?.trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s/-]/g, "")
    .toLowerCase() ?? null;
}

function parseNumeric(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[$,\s]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | null) {
  const parsed = parseNumeric(value);

  return parsed === null ? null : Math.trunc(parsed);
}

function buildDuplicateKey(payload: Record<string, string | number | null>) {
  return [
    payload.year,
    payload.make,
    payload.model,
    payload.vin,
    payload.saleRaw,
    payload.financierAlias,
    payload.netGross,
    payload.pickUp,
  ]
    .map((value) => String(value ?? ""))
    .join("|");
}

function matchDealerAssignment(
  financierId: string | null,
  periodMonth: string,
  assignments: DealerFinancierAssignmentLookup[],
) {
  if (!financierId) {
    return null;
  }

  return (
    assignments.find((assignment) => {
      if (assignment.financierId !== financierId) {
        return false;
      }

      const startsBefore = assignment.effectiveFrom <= periodMonth;
      const endsAfter =
        assignment.effectiveTo === null || assignment.effectiveTo >= periodMonth;

      return startsBefore && endsAfter;
    }) ?? null
  );
}

export function normalizeImportRows(params: {
  rows: Record<string, string | null>[];
  financierAliases: FinancierAliasLookup[];
  assignments: DealerFinancierAssignmentLookup[];
  periodMonth: string;
}): NormalizedImportRow[] {
  const aliasMap = new Map<string, FinancierAliasLookup>();

  params.financierAliases.forEach((alias) => {
    aliasMap.set(alias.normalizedAlias, alias);
  });

  return params.rows.map((row, index) => {
    const validationErrors = [];
    const warnings = [];

    const normalizedFinanceAlias = normalizeText(row["Finance"] ?? null);
    const matchedAlias = normalizedFinanceAlias
      ? aliasMap.get(normalizedFinanceAlias) ?? null
      : null;

    const saleRaw = row["Sale"]?.trim() ?? null;
    const saleValue = parseNumeric(row["Sale"] ?? null);
    const year = parseInteger(row["Year"] ?? null);
    const netGross = parseNumeric(row["Net Gross"] ?? null);
    const pickUp = parseNumeric(row["Pick Up"] ?? null) ?? 0;
    const vin = row["VIN"]?.trim().toUpperCase() ?? null;
    const make = row["Make"]?.trim() ?? null;
    const model = row["Model"]?.trim() ?? null;
    const financierAlias = row["Finance"]?.trim() ?? null;

    if (!year) {
      validationErrors.push({
        code: "invalid_year",
        message: "Year is missing or invalid.",
        field: "Year",
        severity: "error" as const,
      });
    }

    if (!make) {
      validationErrors.push({
        code: "missing_make",
        message: "Make is required.",
        field: "Make",
        severity: "error" as const,
      });
    }

    if (!model) {
      validationErrors.push({
        code: "missing_model",
        message: "Model is required.",
        field: "Model",
        severity: "error" as const,
      });
    }

    if (!vin) {
      validationErrors.push({
        code: "missing_vin",
        message: "VIN is required.",
        field: "VIN",
        severity: "error" as const,
      });
    }

    if (!saleRaw) {
      validationErrors.push({
        code: "missing_sale",
        message: "Sale is required.",
        field: "Sale",
        severity: "error" as const,
      });
    }

    if (netGross === null) {
      validationErrors.push({
        code: "invalid_net_gross",
        message: "Net Gross is missing or invalid.",
        field: "Net Gross",
        severity: "error" as const,
      });
    }

    if (!matchedAlias && financierAlias) {
      warnings.push({
        code: "unknown_financier_alias",
        message: "Finance alias was not matched to a configured financier.",
        field: "Finance",
        severity: "warning" as const,
      });
    }

    const dealerAssignment = matchDealerAssignment(
      matchedAlias?.financierId ?? null,
      params.periodMonth,
      params.assignments,
    );

    if (!dealerAssignment && matchedAlias) {
      warnings.push({
        code: "missing_dealer_assignment",
        message:
          "The financier alias was matched, but no dealer assignment was found for the sale date.",
        field: "Finance",
        severity: "warning" as const,
      });
    }

    const normalizedPayload = {
      year,
      make,
      model,
      vin,
      saleRaw,
      saleValue,
      periodMonth: params.periodMonth,
      financierAlias,
      netGross,
      pickUp,
      financierId: matchedAlias?.financierId ?? null,
      financierName: matchedAlias?.financierName ?? null,
      dealerId: dealerAssignment?.dealerId ?? null,
      dealerName: dealerAssignment?.dealerName ?? null,
    };

    return {
      rowNumber: index + 2,
      originalPayload: row,
      normalizedPayload,
      validationErrors,
      warnings,
      detectedFinancierId: matchedAlias?.financierId ?? null,
      detectedFinancierName: matchedAlias?.financierName ?? null,
      detectedDealerId: dealerAssignment?.dealerId ?? null,
      detectedDealerName: dealerAssignment?.dealerName ?? null,
      duplicateKey: buildDuplicateKey(normalizedPayload),
    };
  });
}

export function normalizeFinancierAlias(value: string) {
  return normalizeText(value) ?? "";
}
