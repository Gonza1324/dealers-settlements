import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/get-session";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { uploadImportFileToStorage } from "@/features/imports/server/storage";
import { parseImportFile } from "@/features/imports/server/parser";
import { detectDuplicates } from "@/features/imports/server/duplicates";
import {
  normalizeImportRows,
  normalizeEditedRow,
} from "@/features/imports/server/normalization";
import { recordImportReviewActions } from "@/features/imports/server/review-actions";
import type { ConsolidationSummary } from "@/features/deals/types";
import type {
  DealerFinancierAssignmentLookup,
  DuplicateDetectionRecord,
  FinancierAliasLookup,
  ImportExecutionResult,
  ImportTemplateRecord,
  NormalizedImportPayload,
} from "@/features/imports/server/types";
import type { ImportReviewActionInput } from "@/features/imports/server/review-schema";
import type { ImportHistoryRecord, ImportRowReview } from "@/features/imports/types";
import { validateImportHeaders } from "@/features/imports/validators";
import { mapImportRow, mapImportTemplate } from "@/features/imports/mappers";

const DEFAULT_IMPORT_TEMPLATE = {
  name: "Floorplan Default",
  source_type: "floorplan",
  expected_headers: [
    "Year",
    "Make",
    "Model",
    "VIN",
    "Sale",
    "Finance",
    "Net Gross",
    "Pick Up",
  ],
  column_map_json: {
    year: "Year",
    make: "Make",
    model: "Model",
    vin: "VIN",
    sale: "Sale",
    finance: "Finance",
    net_gross: "Net Gross",
    pick_up: "Pick Up",
  },
  is_active: true,
} satisfies Omit<ImportTemplateRecord, "id">;

type ImportFileInsert = {
  template_id: string;
  source_type: string;
  period_month: string;
  file_name: string;
  storage_path: string;
  file_hash: string;
  status: "uploaded" | "validated" | "consolidated" | "error";
  row_count: number;
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
};

type ExistingImportFileMatch = {
  id: string;
  status: string;
  row_count: number;
  metadata: Record<string, unknown>;
};

type RawRowForSummary = {
  id: string;
  error_messages: unknown;
  warning_messages: unknown;
  duplicate_status: string;
  review_status: string;
  is_ready_for_consolidation: boolean;
  normalized_payload: unknown;
};

type ConsolidationRpcRow = {
  source_row_id: string;
  deal_id: string | null;
  status: string;
  message: string;
};

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function getMonthRange(sourceMonth: string) {
  const date = new Date(sourceMonth);
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return {
    start: date.toISOString().slice(0, 10),
    end: nextMonth.toISOString().slice(0, 10),
  };
}

function mapNormalizedPayload(
  value: unknown,
  periodMonthFallback?: string,
): NormalizedImportPayload {
  const payload = (value as Record<string, unknown> | null) ?? {};

  return {
    periodMonth:
      typeof payload.periodMonth === "string"
        ? payload.periodMonth
        : periodMonthFallback ?? "",
    yearValue:
      typeof payload.yearValue === "number"
        ? payload.yearValue
        : typeof payload.year === "number"
          ? payload.year
          : null,
    makeValue:
      typeof payload.makeValue === "string"
        ? payload.makeValue
        : typeof payload.make === "string"
          ? payload.make
          : null,
    modelValue:
      typeof payload.modelValue === "string"
        ? payload.modelValue
        : typeof payload.model === "string"
          ? payload.model
          : null,
    vinValue:
      typeof payload.vinValue === "string"
        ? payload.vinValue
        : typeof payload.vin === "string"
          ? payload.vin
          : null,
    saleValue:
      typeof payload.saleValue === "string"
        ? payload.saleValue
        : typeof payload.saleRaw === "string"
          ? payload.saleRaw
        : null,
    financeRaw:
      typeof payload.financeRaw === "string"
        ? payload.financeRaw
        : typeof payload.financierAlias === "string"
          ? payload.financierAlias
          : null,
    financeNormalized:
      typeof payload.financeNormalized === "string"
        ? payload.financeNormalized
        : null,
    netGrossValue:
      typeof payload.netGrossValue === "number"
        ? payload.netGrossValue
        : typeof payload.netGross === "number"
          ? payload.netGross
          : null,
    pickupValue:
      typeof payload.pickupValue === "number"
        ? payload.pickupValue
        : typeof payload.pickUp === "number"
          ? payload.pickUp
          : 0,
    assignedFinancierId:
      typeof payload.assignedFinancierId === "string"
        ? payload.assignedFinancierId
        : typeof payload.financierId === "string"
          ? payload.financierId
          : null,
    assignedFinancierName:
      typeof payload.assignedFinancierName === "string"
        ? payload.assignedFinancierName
        : typeof payload.financierName === "string"
          ? payload.financierName
          : null,
    assignedDealerId:
      typeof payload.assignedDealerId === "string"
        ? payload.assignedDealerId
        : typeof payload.dealerId === "string"
          ? payload.dealerId
          : null,
    assignedDealerName:
      typeof payload.assignedDealerName === "string"
        ? payload.assignedDealerName
        : typeof payload.dealerName === "string"
          ? payload.dealerName
          : null,
  };
}

function mapIssueCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function isRowApprovable(row: RawRowForSummary) {
  const payload = mapNormalizedPayload(row.normalized_payload);

  return (
    mapIssueCount(row.error_messages) === 0 &&
    mapIssueCount(row.warning_messages) === 0 &&
    row.duplicate_status === "unique" &&
    Boolean(payload.assignedDealerId) &&
    Boolean(payload.assignedFinancierId)
  );
}

function mapConsolidationSummary(rows: ConsolidationRpcRow[]): ConsolidationSummary {
  const mappedRows = rows.map((row) => ({
    sourceRowId: row.source_row_id,
    dealId: row.deal_id,
    status:
      row.status === "consolidated" ||
      row.status === "skipped" ||
      row.status === "failed"
        ? row.status
        : "failed",
    message: row.message,
  })) satisfies ConsolidationSummary["rows"];

  return {
    consolidatedCount: mappedRows.filter((row) => row.status === "consolidated").length,
    skippedCount: mappedRows.filter((row) => row.status === "skipped").length,
    failedCount: mappedRows.filter((row) => row.status === "failed").length,
    rows: mappedRows,
  };
}

async function getActiveTemplate(templateId: string): Promise<ImportTemplateRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !data) {
    throw new Error("Import template not found.");
  }

  return {
    id: String(data.id),
    name: String(data.name),
    source_type: String(data.source_type),
    expected_headers:
      (data.expected_headers as ImportTemplateRecord["expected_headers"]) ?? [],
    column_map_json:
      (data.column_map_json as ImportTemplateRecord["column_map_json"]) ?? {},
    is_active: Boolean(data.is_active),
  };
}

async function ensureDefaultImportTemplate() {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("import_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (existingError) {
    throw new Error(`Failed to load import templates: ${existingError.message}`);
  }

  if ((existing ?? []).length > 0) {
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from("import_templates")
    .insert(DEFAULT_IMPORT_TEMPLATE)
    .select("*");

  if (createError) {
    throw new Error(`Failed to create default import template: ${createError.message}`);
  }

  return created ?? [];
}

async function getLookups() {
  const supabase = createSupabaseAdminClient();

  const [{ data: aliases, error: aliasError }, { data: assignments, error: assignmentError }] =
    await Promise.all([
      supabase
        .from("financier_aliases")
        .select("normalized_alias, financier_id, financiers!inner(name)")
        .is("deleted_at", null)
        .order("normalized_alias"),
      supabase
        .from("dealer_financier_assignments")
        .select("financier_id, dealer_id, start_date, end_date, dealers!inner(name)")
        .is("deleted_at", null),
    ]);

  if (aliasError) {
    throw new Error(`Failed to load financier aliases: ${aliasError.message}`);
  }

  if (assignmentError) {
    throw new Error(
      `Failed to load dealer-financier assignments: ${assignmentError.message}`,
    );
  }

  const financierAliases: FinancierAliasLookup[] = (aliases ?? []).map((alias) => ({
    normalizedAlias: String(alias.normalized_alias),
    financierId: String(alias.financier_id),
    financierName: String((alias.financiers as { name?: string } | null)?.name ?? ""),
  }));

  const dealerAssignments: DealerFinancierAssignmentLookup[] = (
    assignments ?? []
  ).map((assignment) => ({
    financierId: String(assignment.financier_id),
    dealerId: String(assignment.dealer_id),
    effectiveFrom: String(assignment.start_date),
    effectiveTo: assignment.end_date ? String(assignment.end_date) : null,
    dealerName: String((assignment.dealers as { name?: string } | null)?.name ?? ""),
  }));

  return { financierAliases, dealerAssignments };
}

async function getExistingDuplicateRows(params: {
  sourceMonth: string;
  excludeImportFileId?: string;
}): Promise<DuplicateDetectionRecord[]> {
  const supabase = createSupabaseAdminClient();
  const range = getMonthRange(params.sourceMonth);
  let query = supabase
    .from("raw_deal_rows")
    .select("id, normalized_payload")
    .gte("period_month", range.start)
    .lt("period_month", range.end);

  if (params.excludeImportFileId) {
    query = query.neq("import_file_id", params.excludeImportFileId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load duplicate checks: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const payload = mapNormalizedPayload(row.normalized_payload, params.sourceMonth);
    return {
      id: String(row.id),
      exactDuplicateKey: [
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
        .join("|"),
      possibleDuplicateKey: [
        payload.periodMonth,
        payload.vinValue,
        payload.yearValue,
        payload.makeValue,
        payload.modelValue,
        payload.saleValue,
      ]
        .map((value) => String(value ?? ""))
        .join("|"),
    };
  });
}

async function insertImportFile(record: ImportFileInsert) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_files")
    .insert(record)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create import file record: ${error?.message}`);
  }

  return data.id as string;
}

async function getExistingImportFile(params: {
  fileHash: string;
  sourceMonth: string;
}): Promise<ExistingImportFileMatch | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_files")
    .select("id, status, row_count, metadata")
    .eq("file_hash", params.fileHash)
    .eq("period_month", params.sourceMonth)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check existing imports: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: String(data.id),
    status: String(data.status),
    row_count: Number(data.row_count ?? 0),
    metadata: ((data.metadata as Record<string, unknown> | null) ?? {}),
  };
}

async function updateImportFile(params: {
  importFileId: string;
  status: "uploaded" | "validated" | "consolidated" | "error";
  rowCount: number;
  metadata: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("import_files")
    .update({
      status: params.status,
      row_count: params.rowCount,
      metadata: params.metadata as never,
    })
    .eq("id", params.importFileId);

  if (error) {
    throw new Error(`Failed to update import file: ${error.message}`);
  }
}

async function insertRawRows(params: {
  importFileId: string;
  rows: Array<
    ReturnType<typeof detectDuplicates>["rows"][number]
  >;
}) {
  const supabase = createSupabaseAdminClient();
  const records = params.rows.map((row) => ({
    import_file_id: params.importFileId,
    row_number: row.rowNumber,
    period_month: row.normalizedPayload.periodMonth,
    raw_payload: row.originalPayload,
    normalized_payload: row.normalizedPayload,
    year_value: row.normalizedPayload.yearValue,
    make_value: row.normalizedPayload.makeValue,
    model_value: row.normalizedPayload.modelValue,
    vin_value: row.normalizedPayload.vinValue,
    sale_value: row.normalizedPayload.saleValue,
    finance_raw: row.normalizedPayload.financeRaw,
    finance_normalized: row.normalizedPayload.financeNormalized,
    net_gross_value: row.normalizedPayload.netGrossValue,
    pickup_value: row.normalizedPayload.pickupValue,
    validation_status:
      row.validationErrors.length > 0
        ? "invalid"
        : row.warnings.length > 0
          ? "warning"
          : "valid",
    duplicate_status: row.duplicateStatus,
    review_status: "pending",
    duplicate_key: row.duplicateGroup,
    assigned_financier_id: row.detectedFinancierId,
    assigned_dealer_id: row.detectedDealerId,
    error_messages: row.validationErrors,
    warning_messages: row.warnings,
    is_ready_for_consolidation: false,
  }));

  const { error } = await supabase.from("raw_deal_rows").insert(records);

  if (error) {
    throw new Error(`Failed to insert raw deal rows: ${error.message}`);
  }
}

async function refreshImportSummary(importFileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: importFile, error: importFileError } = await supabase
    .from("import_files")
    .select("id, metadata")
    .eq("id", importFileId)
    .single();

  if (importFileError || !importFile) {
    throw new Error("Import file not found while refreshing summary.");
  }

  const { data: rows, error: rowsError } = await supabase
    .from("raw_deal_rows")
    .select(
      "id, error_messages, warning_messages, duplicate_status, review_status, is_ready_for_consolidation, normalized_payload",
    )
    .eq("import_file_id", importFileId);

  if (rowsError) {
    throw new Error(`Failed to refresh import summary: ${rowsError.message}`);
  }

  const currentRows = (rows ?? []) as RawRowForSummary[];
  const rowsWithErrors = currentRows.filter(
    (row) => mapIssueCount(row.error_messages) > 0,
  ).length;
  const rowsWithWarnings = currentRows.filter(
    (row) => mapIssueCount(row.warning_messages) > 0,
  ).length;
  const duplicateRows = currentRows.filter(
    (row) => row.duplicate_status !== "unique",
  ).length;
  const readyRows = currentRows.filter((row) => row.is_ready_for_consolidation).length;
  const approvedRows = currentRows.filter((row) => row.review_status === "approved").length;
  const pendingRows = currentRows.filter((row) => row.review_status === "pending").length;
  const metadata = (importFile.metadata as Record<string, unknown>) ?? {};
  const criticalErrors = Array.isArray(metadata.criticalErrors)
    ? (metadata.criticalErrors as string[])
    : [];

  await updateImportFile({
    importFileId,
    status: criticalErrors.length > 0 ? "error" : "validated",
    rowCount: currentRows.length,
    metadata: {
      ...metadata,
      rowsWithErrors,
      rowsWithWarnings,
      duplicateRows,
      readyRows,
      approvedRows,
      pendingRows,
    },
  });
}

async function recalculateImportDuplicates(importFileId: string, periodMonth: string) {
  const supabase = createSupabaseAdminClient();
  const { data: currentRows, error: currentRowsError } = await supabase
    .from("raw_deal_rows")
    .select(
      "id, row_number, raw_payload, normalized_payload, error_messages, warning_messages, assigned_financier_id, assigned_dealer_id, review_status",
    )
    .eq("import_file_id", importFileId)
    .order("row_number");

  if (currentRowsError) {
    throw new Error(`Failed to recalculate duplicates: ${currentRowsError.message}`);
  }

  const rowsForDetection = (currentRows ?? []).map((row) => {
    const normalizedPayload = mapNormalizedPayload(row.normalized_payload, periodMonth);

    return {
      rowNumber: Number(row.row_number),
      originalPayload: (row.raw_payload as Record<string, string | null>) ?? {},
      normalizedPayload,
      validationErrors: Array.isArray(row.error_messages)
        ? (row.error_messages as ImportRowReview["validationErrors"])
        : [],
      warnings: Array.isArray(row.warning_messages)
        ? (row.warning_messages as ImportRowReview["warnings"])
        : [],
      detectedFinancierId: normalizedPayload.assignedFinancierId,
      detectedFinancierName: normalizedPayload.assignedFinancierName,
      detectedDealerId: normalizedPayload.assignedDealerId,
      detectedDealerName: normalizedPayload.assignedDealerName,
      exactDuplicateKey: [
        normalizedPayload.periodMonth,
        normalizedPayload.vinValue,
        normalizedPayload.yearValue,
        normalizedPayload.makeValue,
        normalizedPayload.modelValue,
        normalizedPayload.saleValue,
        normalizedPayload.financeNormalized,
        normalizedPayload.netGrossValue,
        normalizedPayload.pickupValue,
      ]
        .map((value) => String(value ?? ""))
        .join("|"),
      possibleDuplicateKey: [
        normalizedPayload.periodMonth,
        normalizedPayload.vinValue,
        normalizedPayload.yearValue,
        normalizedPayload.makeValue,
        normalizedPayload.modelValue,
        normalizedPayload.saleValue,
      ]
        .map((value) => String(value ?? ""))
        .join("|"),
    };
  });

  const existingRows = await getExistingDuplicateRows({
    sourceMonth: periodMonth,
    excludeImportFileId: importFileId,
  });

  const deduplicated = detectDuplicates({
    rows: rowsForDetection,
    existingRows,
  });

  for (const row of deduplicated.rows) {
    const current = currentRows?.find((currentRow) => currentRow.row_number === row.rowNumber);
    if (!current) {
      continue;
    }

    const existingReviewStatus = String(
      (current as Record<string, unknown>).review_status ?? "pending",
    );
    const approvable =
      row.validationErrors.length === 0 &&
      row.warnings.length === 0 &&
      row.duplicateStatus === "unique" &&
      Boolean(row.detectedDealerId) &&
      Boolean(row.detectedFinancierId);

    const nextReviewStatus =
      existingReviewStatus === "approved" && !approvable ? "pending" : existingReviewStatus;

    const { error } = await supabase
      .from("raw_deal_rows")
      .update({
        duplicate_status: row.duplicateStatus,
        duplicate_key: row.duplicateGroup,
        review_status: nextReviewStatus,
        is_ready_for_consolidation:
          nextReviewStatus === "approved" && approvable,
      })
      .eq("id", current.id);

    if (error) {
      throw new Error(`Failed to update duplicate state: ${error.message}`);
    }
  }

  await refreshImportSummary(importFileId);
}

export async function processImportUpload(params: {
  file: File;
  sourceMonth: string;
  templateId: string;
}): Promise<ImportExecutionResult> {
  const template = await getActiveTemplate(params.templateId);
  const arrayBuffer = await params.file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const fileExtension = getFileExtension(params.file.name);
  const checksum = createHash("sha256").update(fileBuffer).digest("hex");

  if (!["csv", "xlsx", "xls"].includes(fileExtension)) {
    throw new Error("Unsupported file extension.");
  }

  const existingImport = await getExistingImportFile({
    fileHash: checksum,
    sourceMonth: params.sourceMonth,
  });

  if (existingImport) {
    const metadata = existingImport.metadata;

    return {
      importFileId: existingImport.id,
      criticalErrors: Array.isArray(metadata.criticalErrors)
        ? metadata.criticalErrors.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      warnings: ["This exact file was already uploaded for this source month."],
      rowCount: existingImport.row_count,
      rowsWithErrors:
        typeof metadata.rowsWithErrors === "number" ? metadata.rowsWithErrors : 0,
      rowsWithWarnings:
        typeof metadata.rowsWithWarnings === "number"
          ? metadata.rowsWithWarnings
          : 0,
      duplicateRows:
        typeof metadata.duplicateRows === "number" ? metadata.duplicateRows : 0,
      status: existingImport.status,
      reusedExisting: true,
    };
  }

  const storagePath = await uploadImportFileToStorage({
    filename: params.file.name,
    sourceMonth: params.sourceMonth,
    fileBuffer,
    contentType:
      params.file.type ||
      (fileExtension === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  });

  const currentUser = await getCurrentUser();
  const parsedWorkbook = parseImportFile(fileBuffer, params.file.name);
  const structureValidation = validateImportHeaders(
    parsedWorkbook.headers,
    template.expected_headers.map((name) => ({ name, required: true })),
  );

  const importFileId = await insertImportFile({
    template_id: template.id,
    source_type: template.source_type,
    period_month: params.sourceMonth,
    file_name: params.file.name,
    storage_path: storagePath,
    file_hash: checksum,
    status: structureValidation.isValid ? "uploaded" : "error",
    row_count: 0,
    metadata: {
      headers: parsedWorkbook.headers,
      templateName: template.name,
      sourceType: template.source_type,
      criticalErrors: structureValidation.criticalErrors,
      structureWarnings: structureValidation.warnings,
    },
    uploaded_by: currentUser?.id ?? null,
  });

  if (!structureValidation.isValid) {
    await refreshImportSummary(importFileId);

    await writeAuditLog({
      actorUserId: currentUser?.id ?? null,
      entityTable: "import_files",
      entityId: importFileId,
      action: "import_uploaded_invalid_structure",
      before: null,
      after: {
        templateId: template.id,
        sourceMonth: params.sourceMonth,
        filename: params.file.name,
      },
      metadata: {
        warnings: structureValidation.warnings,
        criticalErrors: structureValidation.criticalErrors,
      },
    });

    return {
      importFileId,
      criticalErrors: structureValidation.criticalErrors,
      warnings: structureValidation.warnings,
      rowCount: 0,
      rowsWithErrors: 0,
      rowsWithWarnings: 0,
      duplicateRows: 0,
      status: "error",
    };
  }

  const { financierAliases, dealerAssignments } = await getLookups();
  const normalizedRows = normalizeImportRows({
    rows: parsedWorkbook.rows,
    financierAliases,
    assignments: dealerAssignments,
    periodMonth: params.sourceMonth,
  });
  const existingRows = await getExistingDuplicateRows({
    sourceMonth: params.sourceMonth,
  });
  const deduplicated = detectDuplicates({
    rows: normalizedRows,
    existingRows,
  });

  await insertRawRows({
    importFileId,
    rows: deduplicated.rows,
  });
  await refreshImportSummary(importFileId);

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "import_files",
    entityId: importFileId,
    action: "import_uploaded",
    before: null,
    after: {
      templateId: template.id,
      sourceMonth: params.sourceMonth,
      filename: params.file.name,
      rowCount: deduplicated.rows.length,
    },
    metadata: {
      warnings: structureValidation.warnings,
      duplicateRows: deduplicated.duplicateRows,
    },
  });

  const rowsWithErrors = deduplicated.rows.filter(
    (row) => row.validationErrors.length > 0,
  ).length;
  const rowsWithWarnings = deduplicated.rows.filter(
    (row) => row.warnings.length > 0,
  ).length;

  return {
    importFileId,
    criticalErrors: [],
    warnings: structureValidation.warnings,
    rowCount: deduplicated.rows.length,
    rowsWithErrors,
    rowsWithWarnings,
    duplicateRows: deduplicated.duplicateRows,
    status: "validated",
  };
}

export async function getImportTemplates() {
  const templates = await ensureDefaultImportTemplate();

  return templates.map((record) => mapImportTemplate(record));
}

export async function getRecentImports(): Promise<ImportHistoryRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_files")
    .select("id, period_month, file_name, status, row_count, metadata")
    .is("deleted_at", null)
    .order("period_month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to load recent imports: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((record) => {
    const metadata = (record.metadata as Record<string, unknown> | null) ?? {};

    return {
      id: String(record.id),
      sourceMonth: String(record.period_month),
      originalFilename: String(record.file_name),
      status: String(record.status) as ImportHistoryRecord["status"],
      rowCount: Number(record.row_count ?? 0),
      readyRows: Number(metadata.readyRows ?? 0),
      approvedRows: Number(metadata.approvedRows ?? 0),
      pendingRows: Number(metadata.pendingRows ?? 0),
      consolidatedRows: Number(metadata.consolidatedRows ?? 0),
    };
  });
}

export async function getImportReview(importFileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: importFile, error: importFileError } = await supabase
    .from("import_files")
    .select("id, period_month, file_name, status, row_count, metadata, template_id")
    .eq("id", importFileId)
    .single();

  if (importFileError || !importFile) {
    throw new Error("Import file not found.");
  }

  const [{ data: template, error: templateError }, { data: rows, error: rowsError }] =
    await Promise.all([
      supabase
        .from("import_templates")
        .select("*")
        .eq("id", importFile.template_id)
        .single(),
      supabase
        .from("raw_deal_rows")
        .select(
          "id, row_number, raw_payload, normalized_payload, error_messages, warning_messages, validation_status, duplicate_status, review_status, is_ready_for_consolidation, duplicate_key, detected_dealer:dealers(name), detected_financier:financiers(name)",
        )
        .eq("import_file_id", importFileId)
        .order("row_number"),
    ]);

  if (templateError || !template) {
    throw new Error("Import template not found for this import file.");
  }

  if (rowsError) {
    throw new Error(`Failed to load raw rows: ${rowsError.message}`);
  }

  const rowIds = ((rows ?? []) as Array<{ id: string }>).map((row) => String(row.id));
  let consolidatedMap = new Map<string, string>();

  if (rowIds.length > 0) {
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("id, source_row_id")
      .in("source_row_id", rowIds)
      .is("deleted_at", null);

    if (dealsError) {
      throw new Error(`Failed to load consolidated deals: ${dealsError.message}`);
    }

    consolidatedMap = new Map(
      ((deals ?? []) as Array<{ id: string; source_row_id: string | null }>)
        .filter((deal) => Boolean(deal.source_row_id))
        .map((deal) => [String(deal.source_row_id), String(deal.id)]),
    );
  }

  const rawMappedRows = (rows ?? []).map((row) => ({
    ...row,
    detected_dealer_name:
      ((row.detected_dealer as { name?: string }[] | null)?.[0]?.name ??
        (row.detected_dealer as { name?: string } | null)?.name ??
        null),
    detected_financier_name:
      ((row.detected_financier as { name?: string }[] | null)?.[0]?.name ??
        (row.detected_financier as { name?: string } | null)?.name ??
        null),
    is_consolidated: consolidatedMap.has(String(row.id)),
    consolidated_deal_id: consolidatedMap.get(String(row.id)) ?? null,
  }));

  const mappedRows = rawMappedRows.map((row) =>
    mapImportRow(row as Record<string, unknown>),
  );

  const validRows = mappedRows.filter((row) => row.validationStatus === "valid").length;
  const rowsWithErrors = mappedRows.filter(
    (row) => row.validationErrors.length > 0,
  ).length;
  const rowsWithWarnings = mappedRows.filter(
    (row) => row.warnings.length > 0,
  ).length;
  const duplicateRows = mappedRows.filter((row) => row.isDuplicate).length;
  const readyRows = mappedRows.filter((row) => row.isReadyForConsolidation).length;
  const approvedRows = mappedRows.filter((row) => row.reviewStatus === "approved").length;
  const pendingRows = mappedRows.filter((row) => row.reviewStatus === "pending").length;
  const consolidatedRows = mappedRows.filter((row) => row.isConsolidated).length;
  const importMetadata = (importFile.metadata as Record<string, unknown>) ?? {};
  const criticalErrors = Array.isArray(importMetadata.criticalErrors)
    ? (importMetadata.criticalErrors as string[])
    : [];
  const canProceedToConsolidation =
    criticalErrors.length === 0 &&
    mappedRows.every(
      (row) =>
        row.reviewStatus === "approved" || row.reviewStatus === "rejected",
    ) &&
    mappedRows.some((row) => row.reviewStatus === "approved");

  return {
    importFile: {
      id: String(importFile.id),
      sourceMonth: String(importFile.period_month),
      originalFilename: String(importFile.file_name),
      status: String(importFile.status) as
        | "uploaded"
        | "validated"
        | "consolidated"
        | "error",
      rowCount: Number(importFile.row_count),
      metadata: importMetadata,
    },
    template: mapImportTemplate(template as Record<string, unknown>),
    summary: {
      totalRows: mappedRows.length,
      validRows,
      rowsWithErrors,
      rowsWithWarnings,
      duplicateRows,
      readyRows,
      approvedRows,
      pendingRows,
      consolidatedRows,
      criticalErrors,
      canProceedToConsolidation,
    },
    rows: mappedRows,
  };
}

async function updateImportConsolidationStatus(importFileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("raw_deal_rows")
    .select("id, review_status")
    .eq("import_file_id", importFileId);

  if (error) {
    throw new Error(`Failed to update import consolidation status: ${error.message}`);
  }

  const rowIds = ((rows ?? []) as Array<{ id: string; review_status: string }>).map((row) =>
    String(row.id),
  );

  let consolidatedIds = new Set<string>();

  if (rowIds.length > 0) {
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("source_row_id")
      .in("source_row_id", rowIds)
      .is("deleted_at", null);

    if (dealsError) {
      throw new Error(`Failed to read consolidated rows: ${dealsError.message}`);
    }

    consolidatedIds = new Set(
      ((deals ?? []) as Array<{ source_row_id: string | null }>)
        .map((deal) => deal.source_row_id)
        .filter(Boolean) as string[],
    );
  }

  const approvedRows = ((rows ?? []) as Array<{ id: string; review_status: string }>).filter(
    (row) => row.review_status === "approved",
  );
  const allApprovedConsolidated =
    approvedRows.length > 0 &&
    approvedRows.every((row) => consolidatedIds.has(String(row.id)));

  const { data: currentImportFile, error: importError } = await supabase
    .from("import_files")
    .select("metadata")
    .eq("id", importFileId)
    .single();

  if (importError || !currentImportFile) {
    throw new Error("Import file not found while updating consolidation status.");
  }

  const metadata = (currentImportFile.metadata as Record<string, unknown>) ?? {};

  const { error: updateError } = await supabase
    .from("import_files")
    .update({
      status: allApprovedConsolidated ? "consolidated" : "validated",
      metadata: {
        ...metadata,
        consolidatedRows: consolidatedIds.size,
      } as never,
    })
    .eq("id", importFileId);

  if (updateError) {
    throw new Error(`Failed to update import status: ${updateError.message}`);
  }
}

export async function consolidateImportRows(params: {
  importFileId: string;
  rowIds: string[];
}): Promise<ConsolidationSummary> {
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Unauthorized.");
  }

  const { data: importFile, error: importError } = await supabase
    .from("import_files")
    .select("id")
    .eq("id", params.importFileId)
    .single();

  if (importError || !importFile) {
    throw new Error("Import file not found.");
  }

  const { data: rows, error: rowsError } = await supabase
    .from("raw_deal_rows")
    .select("id")
    .eq("import_file_id", params.importFileId)
    .in("id", params.rowIds);

  if (rowsError) {
    throw new Error(`Failed to validate selected rows: ${rowsError.message}`);
  }

  const validRowIds = ((rows ?? []) as Array<{ id: string }>).map((row) => String(row.id));

  if (validRowIds.length === 0) {
    throw new Error("No valid rows were selected for consolidation.");
  }

  const { data, error } = await supabase.rpc("consolidate_approved_raw_rows", {
    p_row_ids: validRowIds,
    p_actor_user_id: currentUser.id,
  });

  if (error) {
    throw new Error(`Failed to consolidate rows: ${error.message}`);
  }

  await updateImportConsolidationStatus(params.importFileId);
  const summary = mapConsolidationSummary((data ?? []) as ConsolidationRpcRow[]);

  await writeAuditLog({
    actorUserId: currentUser.id,
    entityTable: "import_files",
    entityId: params.importFileId,
    action: "deals_consolidated_from_import",
    before: null,
    after: {
      consolidatedCount: summary.consolidatedCount,
      skippedCount: summary.skippedCount,
      failedCount: summary.failedCount,
    },
    metadata: {
      rowIds: validRowIds,
      rows: summary.rows,
    },
  });

  return summary;
}

export async function applyImportReviewAction(params: {
  importFileId: string;
  action: ImportReviewActionInput;
}) {
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();

  if (params.action.action === "discard_import") {
    const { data: importFile, error: importFileError } = await supabase
      .from("import_files")
      .select("*")
      .eq("id", params.importFileId)
      .single();

    if (importFileError || !importFile) {
      throw new Error("Import file not found.");
    }

    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("id")
      .eq("source_file_id", params.importFileId)
      .is("deleted_at", null)
      .limit(1);

    if (dealsError) {
      throw new Error(`Failed to validate import deletion: ${dealsError.message}`);
    }

    if ((deals ?? []).length > 0) {
      throw new Error(
        "This import already has consolidated deals and cannot be discarded.",
      );
    }

    const storagePath = String(importFile.storage_path ?? "");

    if (storagePath) {
      const { error: storageError } = await supabase
        .storage
        .from(env.importBucketName)
        .remove([storagePath]);

      if (storageError && !storageError.message.toLowerCase().includes("not found")) {
        throw new Error(`Failed to remove import file from storage: ${storageError.message}`);
      }
    }

    const { error: deleteError } = await supabase
      .from("import_files")
      .delete()
      .eq("id", params.importFileId);

    if (deleteError) {
      throw new Error(`Failed to discard import file: ${deleteError.message}`);
    }

    await writeAuditLog({
      actorUserId: currentUser?.id ?? null,
      entityTable: "import_files",
      entityId: params.importFileId,
      action: "import_discarded",
      before: importFile as Record<string, unknown>,
      after: null,
      metadata: { module: "imports" },
    });

    return;
  }

  if (params.action.action === "approve_ready_rows") {
    const { data: rows, error } = await supabase
      .from("raw_deal_rows")
      .select(
        "id, error_messages, warning_messages, duplicate_status, review_status, is_ready_for_consolidation, normalized_payload",
      )
      .eq("import_file_id", params.importFileId);

    if (error) {
      throw new Error(`Failed to load rows for bulk approval: ${error.message}`);
    }

    const approvableIds = ((rows ?? []) as RawRowForSummary[])
      .filter((row) => isRowApprovable(row))
      .map((row) => row.id);

    if (approvableIds.length > 0) {
      const { error: updateError } = await supabase
        .from("raw_deal_rows")
        .update({
          review_status: "approved",
          is_ready_for_consolidation: true,
        })
        .in("id", approvableIds);

      if (updateError) {
        throw new Error(`Failed to approve ready rows: ${updateError.message}`);
      }
    }

    await refreshImportSummary(params.importFileId);
    return;
  }

  if (params.action.action === "approve_row") {
    const { data: row, error } = await supabase
      .from("raw_deal_rows")
      .select(
        "id, error_messages, warning_messages, duplicate_status, review_status, is_ready_for_consolidation, normalized_payload",
      )
      .eq("id", params.action.rowId)
      .eq("import_file_id", params.importFileId)
      .single();

    if (error || !row) {
      throw new Error("Row not found.");
    }

    if (!isRowApprovable(row as RawRowForSummary)) {
      throw new Error("This row still has blockers and cannot be approved.");
    }

    const { error: updateError } = await supabase
      .from("raw_deal_rows")
      .update({
        review_status: "approved",
        is_ready_for_consolidation: true,
      })
      .eq("id", params.action.rowId);

    if (updateError) {
      throw new Error(`Failed to approve row: ${updateError.message}`);
    }

    await writeAuditLog({
      actorUserId: currentUser?.id ?? null,
      entityTable: "raw_deal_rows",
      entityId: params.action.rowId,
      action: "raw_row_approved",
      before: {
        reviewStatus: row.review_status,
        isReadyForConsolidation: row.is_ready_for_consolidation,
      },
      after: {
        reviewStatus: "approved",
        isReadyForConsolidation: true,
      },
      metadata: {
        importFileId: params.importFileId,
        duplicateStatus: row.duplicate_status,
      },
    });

    await refreshImportSummary(params.importFileId);
    return;
  }

  if (params.action.action === "reject_row") {
    const { data: row, error: rowError } = await supabase
      .from("raw_deal_rows")
      .select("id, review_status, is_ready_for_consolidation")
      .eq("id", params.action.rowId)
      .eq("import_file_id", params.importFileId)
      .maybeSingle();

    if (rowError) {
      throw new Error(`Failed to load row before rejection: ${rowError.message}`);
    }

    const { error } = await supabase
      .from("raw_deal_rows")
      .update({
        review_status: "rejected",
        is_ready_for_consolidation: false,
      })
      .eq("id", params.action.rowId)
      .eq("import_file_id", params.importFileId);

    if (error) {
      throw new Error(`Failed to reject row: ${error.message}`);
    }

    await writeAuditLog({
      actorUserId: currentUser?.id ?? null,
      entityTable: "raw_deal_rows",
      entityId: params.action.rowId,
      action: "raw_row_rejected",
      before: row
        ? {
            reviewStatus: row.review_status,
            isReadyForConsolidation: row.is_ready_for_consolidation,
          }
        : null,
      after: {
        reviewStatus: "rejected",
        isReadyForConsolidation: false,
      },
      metadata: {
        importFileId: params.importFileId,
      },
    });

    await refreshImportSummary(params.importFileId);
    return;
  }

  if (params.action.action === "reject_rows") {
    const { data: rows, error: rowsError } = await supabase
      .from("raw_deal_rows")
      .select("id")
      .eq("import_file_id", params.importFileId)
      .in("id", params.action.rowIds);

    if (rowsError) {
      throw new Error(`Failed to load rows for bulk rejection: ${rowsError.message}`);
    }

    const validRowIds = ((rows ?? []) as Array<{ id: string }>).map((row) => String(row.id));

    if (validRowIds.length === 0) {
      throw new Error("No valid rows were selected for rejection.");
    }

    const { error } = await supabase
      .from("raw_deal_rows")
      .update({
        review_status: "rejected",
        is_ready_for_consolidation: false,
      })
      .in("id", validRowIds)
      .eq("import_file_id", params.importFileId);

    if (error) {
      throw new Error(`Failed to reject rows: ${error.message}`);
    }

    await refreshImportSummary(params.importFileId);
    return;
  }

  const { data: importFile, error: importFileError } = await supabase
    .from("import_files")
    .select("period_month")
    .eq("id", params.importFileId)
    .single();

  if (importFileError || !importFile) {
    throw new Error("Import file not found.");
  }

  const { data: row, error: rowError } = await supabase
    .from("raw_deal_rows")
    .select("id, raw_payload, normalized_payload")
    .eq("id", params.action.payload.rowId)
    .eq("import_file_id", params.importFileId)
    .single();

  if (rowError || !row) {
    throw new Error("Row not found.");
  }

  const { financierAliases, dealerAssignments } = await getLookups();
  const nextState = normalizeEditedRow({
    currentRow: row as Record<string, unknown>,
    payload: params.action.payload,
    periodMonth: String(importFile.period_month),
    financierAliases,
    assignments: dealerAssignments,
  });

  await recordImportReviewActions({
    rowId: params.action.payload.rowId,
    editedBy: currentUser?.id ?? null,
    before: mapNormalizedPayload(
      row.normalized_payload,
      String(importFile.period_month),
    ) as unknown as Record<string, unknown>,
    after: nextState.normalizedPayload as unknown as Record<string, unknown>,
  });

  const validationStatus =
    nextState.validationErrors.length > 0
      ? "invalid"
      : nextState.warnings.length > 0
        ? "warning"
        : "valid";

  const { error: updateError } = await supabase
    .from("raw_deal_rows")
    .update({
      raw_payload: nextState.originalPayload,
      normalized_payload: nextState.normalizedPayload,
      year_value: nextState.normalizedPayload.yearValue,
      make_value: nextState.normalizedPayload.makeValue,
      model_value: nextState.normalizedPayload.modelValue,
      vin_value: nextState.normalizedPayload.vinValue,
      sale_value: nextState.normalizedPayload.saleValue,
      finance_raw: nextState.normalizedPayload.financeRaw,
      finance_normalized: nextState.normalizedPayload.financeNormalized,
      net_gross_value: nextState.normalizedPayload.netGrossValue,
      pickup_value: nextState.normalizedPayload.pickupValue,
      validation_status: validationStatus,
      review_status: "pending",
      assigned_financier_id: nextState.detectedFinancierId,
      assigned_dealer_id: nextState.detectedDealerId,
      error_messages: nextState.validationErrors,
      warning_messages: nextState.warnings,
      is_ready_for_consolidation: false,
    })
    .eq("id", params.action.payload.rowId);

  if (updateError) {
    throw new Error(`Failed to update row: ${updateError.message}`);
  }

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "raw_deal_rows",
    entityId: params.action.payload.rowId,
    action: "raw_row_updated_manual",
    before: mapNormalizedPayload(
      row.normalized_payload,
      String(importFile.period_month),
    ) as unknown as Record<string, unknown>,
    after: nextState.normalizedPayload as unknown as Record<string, unknown>,
    metadata: {
      importFileId: params.importFileId,
      validationStatus,
      detectedFinancierId: nextState.detectedFinancierId,
      detectedDealerId: nextState.detectedDealerId,
    },
  });

  await recalculateImportDuplicates(params.importFileId, String(importFile.period_month));
}
