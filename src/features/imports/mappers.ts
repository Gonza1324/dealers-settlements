import type {
  ImportIssue,
  ImportReviewPayload,
  ImportRowReview,
  ImportTemplate,
} from "@/features/imports/types";

function mapIssues(value: unknown): ImportIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((issue) => {
    const current = issue as Record<string, unknown>;

    return {
      code: String(current.code ?? "unknown"),
      message: String(current.message ?? ""),
      field: current.field ? String(current.field) : undefined,
      severity:
        current.severity === "error" || current.severity === "warning"
          ? current.severity
          : "warning",
    };
  });
}

export function mapImportTemplate(record: Record<string, unknown>): ImportTemplate {
  const expectedHeaders = Array.isArray(record.expected_headers)
    ? record.expected_headers.map((header) => String(header))
    : [];

  return {
    id: String(record.id),
    name: String(record.name),
    isActive: Boolean(record.is_active),
    sourceType: String(record.source_type ?? ""),
    columnSchema: expectedHeaders.map((header) => ({
      name: header,
      required: true,
    })),
  };
}

export function mapImportRow(record: Record<string, unknown>): ImportRowReview {
  return {
    id: String(record.id),
    rowNumber: Number(record.row_number),
    originalPayload: (record.raw_payload as Record<string, string | null>) ?? {},
    normalizedPayload:
      (record.normalized_payload as Record<string, string | number | null>) ?? {},
    validationErrors: mapIssues(record.error_messages),
    warnings: mapIssues(record.warning_messages),
    isDuplicate:
      String(record.duplicate_status ?? "not_checked") === "duplicate" ||
      String(record.duplicate_status ?? "not_checked") === "possible_duplicate",
    duplicateGroup: record.duplicate_key ? String(record.duplicate_key) : null,
    validationStatus:
      (record.validation_status as ImportRowReview["validationStatus"]) ?? "valid",
    duplicateStatus:
      (record.duplicate_status as ImportRowReview["duplicateStatus"]) ??
      "not_checked",
    reviewStatus:
      (record.review_status as ImportRowReview["reviewStatus"]) ?? "pending",
    isReadyForConsolidation: Boolean(record.is_ready_for_consolidation),
    detectedDealerName:
      typeof record.detected_dealer_name === "string"
        ? record.detected_dealer_name
        : null,
    detectedFinancierName:
      typeof record.detected_financier_name === "string"
        ? record.detected_financier_name
        : null,
  };
}

export function mapImportReviewPayload(
  data: Record<string, unknown>,
): ImportReviewPayload {
  return {
    importFile: data.importFile as ImportReviewPayload["importFile"],
    template: mapImportTemplate(data.template as Record<string, unknown>),
    summary: data.summary as ImportReviewPayload["summary"],
    rows: Array.isArray(data.rows)
      ? data.rows.map((row) => mapImportRow(row as Record<string, unknown>))
      : [],
  };
}
