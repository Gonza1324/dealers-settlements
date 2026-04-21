import type {
  DealerFinancierAssignmentLookup,
  FinancierAliasLookup,
  MatchingResult,
} from "@/features/imports/server/types";

function normalizeLookupText(value: string | null) {
  return value
    ?.trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s/-]/g, "")
    .toLowerCase() ?? null;
}

export function resolveAssignmentMatch(params: {
  financeNormalized: string | null;
  periodMonth: string;
  financierAliases: FinancierAliasLookup[];
  assignments: DealerFinancierAssignmentLookup[];
}): MatchingResult {
  const warnings: MatchingResult["warnings"] = [];

  if (!params.financeNormalized) {
    return {
      detectedFinancierId: null,
      detectedFinancierName: null,
      detectedDealerId: null,
      detectedDealerName: null,
      warnings,
    };
  }

  const aliasMatch =
    params.financierAliases.find(
      (alias) => alias.normalizedAlias === params.financeNormalized,
    ) ?? null;

  let financierMatch = aliasMatch;

  if (!financierMatch) {
    const nameMatches = params.financierAliases.filter(
      (alias) =>
        normalizeLookupText(alias.financierName) === params.financeNormalized,
    );

    if (nameMatches.length === 1) {
      financierMatch = nameMatches[0];
    } else if (nameMatches.length > 1) {
      warnings.push({
        code: "ambiguous_financier_name",
        message:
          "Finance value matches multiple financiers by name. Pick the correct financier manually.",
        field: "financeRaw",
        severity: "warning",
      });
    }
  }

  if (!financierMatch) {
    warnings.push({
      code: "unknown_financier_alias",
      message:
        "Finance value was not matched to a configured financier alias or financier name.",
      field: "financeRaw",
      severity: "warning",
    });

    return {
      detectedFinancierId: null,
      detectedFinancierName: null,
      detectedDealerId: null,
      detectedDealerName: null,
      warnings,
    };
  }

  const assignmentMatches = params.assignments.filter((assignment) => {
    if (assignment.financierId !== financierMatch.financierId) {
      return false;
    }

    const startsBefore = assignment.effectiveFrom <= params.periodMonth;
    const endsAfter =
      assignment.effectiveTo === null ||
      assignment.effectiveTo >= params.periodMonth;

    return startsBefore && endsAfter;
  });

  if (assignmentMatches.length === 0) {
    warnings.push({
      code: "missing_dealer_assignment",
      message:
        "The financier was matched, but no dealer assignment is active for the selected month.",
      field: "financeRaw",
      severity: "warning",
    });

    return {
      detectedFinancierId: financierMatch.financierId,
      detectedFinancierName: financierMatch.financierName,
      detectedDealerId: null,
      detectedDealerName: null,
      warnings,
    };
  }

  if (assignmentMatches.length > 1) {
    warnings.push({
      code: "ambiguous_dealer_assignment",
      message:
        "Multiple dealer assignments matched this financier for the selected month. Review it manually.",
      field: "financeRaw",
      severity: "warning",
    });

    return {
      detectedFinancierId: financierMatch.financierId,
      detectedFinancierName: financierMatch.financierName,
      detectedDealerId: null,
      detectedDealerName: null,
      warnings,
    };
  }

  const assignment = assignmentMatches[0];

  return {
    detectedFinancierId: financierMatch.financierId,
    detectedFinancierName: financierMatch.financierName,
    detectedDealerId: assignment.dealerId,
    detectedDealerName: assignment.dealerName,
    warnings,
  };
}
