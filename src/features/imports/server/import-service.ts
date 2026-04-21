import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadImportFileToStorage } from "@/features/imports/server/storage";
import { parseImportFile } from "@/features/imports/server/parser";
import { detectDuplicates } from "@/features/imports/server/duplicates";
import {
  normalizeFinancierAlias,
  normalizeImportRows,
} from "@/features/imports/server/normalization";
import type {
  DealerFinancierAssignmentLookup,
  FinancierAliasLookup,
  ImportExecutionResult,
  ImportTemplateRecord,
} from "@/features/imports/server/types";
import { validateImportHeaders } from "@/features/imports/validators";
import { mapImportRow, mapImportTemplate } from "@/features/imports/mappers";

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

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
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

async function getLookups() {
  const supabase = createSupabaseAdminClient();

  const [{ data: aliases, error: aliasError }, { data: assignments, error: assignmentError }] =
    await Promise.all([
      supabase
        .from("financier_aliases")
        .select("normalized_alias, financier_id, financiers!inner(name)")
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

function getMonthRange(sourceMonth: string) {
  const date = new Date(sourceMonth);
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return {
    start: date.toISOString().slice(0, 10),
    end: nextMonth.toISOString().slice(0, 10),
  };
}

async function getExistingDuplicateKeys(sourceMonth: string) {
  const supabase = createSupabaseAdminClient();
  const range = getMonthRange(sourceMonth);
  const { data, error } = await supabase
    .from("raw_deal_rows")
    .select("normalized_payload, period_month")
    .gte("period_month", range.start)
    .lt("period_month", range.end);

  if (error) {
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const payload = row.normalized_payload as Record<string, string | number | null>;

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
    })
    .filter(Boolean);
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

async function updateImportFile(params: {
  importFileId: string;
  status: string;
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
  rows: Array<{
    rowNumber: number;
    originalPayload: Record<string, string | null>;
    normalizedPayload: Record<string, string | number | null>;
    validationErrors: unknown[];
    warnings: unknown[];
    isDuplicate: boolean;
    duplicateGroup: string | null;
    detectedFinancierId: string | null;
    detectedDealerId: string | null;
  }>;
}) {
  const supabase = createSupabaseAdminClient();
  const records = params.rows.map((row) => ({
    import_file_id: params.importFileId,
    row_number: row.rowNumber,
    period_month:
      typeof row.normalizedPayload.periodMonth === "string"
        ? row.normalizedPayload.periodMonth
        : null,
    raw_payload: row.originalPayload,
    normalized_payload: row.normalizedPayload,
    year_value:
      typeof row.normalizedPayload.year === "number"
        ? row.normalizedPayload.year
        : null,
    make_value:
      typeof row.normalizedPayload.make === "string"
        ? row.normalizedPayload.make
        : null,
    model_value:
      typeof row.normalizedPayload.model === "string"
        ? row.normalizedPayload.model
        : null,
    vin_value:
      typeof row.normalizedPayload.vin === "string"
        ? row.normalizedPayload.vin
        : null,
    sale_value:
      typeof row.normalizedPayload.saleValue === "number"
        ? row.normalizedPayload.saleValue
        : null,
    finance_raw:
      typeof row.normalizedPayload.financierAlias === "string"
        ? row.normalizedPayload.financierAlias
        : null,
    finance_normalized:
      typeof row.originalPayload.Finance === "string"
        ? normalizeFinancierAlias(row.originalPayload.Finance)
        : null,
    net_gross_value:
      typeof row.normalizedPayload.netGross === "number"
        ? row.normalizedPayload.netGross
        : null,
    pickup_value:
      typeof row.normalizedPayload.pickUp === "number"
        ? row.normalizedPayload.pickUp
        : null,
    validation_status:
      row.validationErrors.length > 0
        ? "invalid"
        : row.warnings.length > 0
          ? "warning"
          : "valid",
    duplicate_status: row.isDuplicate ? "possible_duplicate" : "unique",
    review_status: "pending",
    duplicate_key: row.duplicateGroup,
    assigned_financier_id: row.detectedFinancierId,
    assigned_dealer_id: row.detectedDealerId,
    error_messages: row.validationErrors,
    warning_messages: row.warnings,
    is_ready_for_consolidation: row.validationErrors.length === 0,
  }));

  const { error } = await supabase.from("raw_deal_rows").insert(records);

  if (error) {
    throw new Error(`Failed to insert raw deal rows: ${error.message}`);
  }
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

  if (!["csv", "xlsx", "xls"].includes(fileExtension)) {
    throw new Error("Unsupported file extension.");
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

  const checksum = createHash("sha256").update(fileBuffer).digest("hex");

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
    uploaded_by: null,
  });

  if (!structureValidation.isValid) {
    await updateImportFile({
      importFileId,
      status: "error",
      rowCount: 0,
      metadata: {
        headers: parsedWorkbook.headers,
        templateName: template.name,
        sourceType: template.source_type,
        criticalErrors: structureValidation.criticalErrors,
        structureWarnings: structureValidation.warnings,
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

  const existingDuplicateKeys = await getExistingDuplicateKeys(params.sourceMonth);
  const deduplicated = detectDuplicates({
    rows: normalizedRows,
    existingKeys: existingDuplicateKeys,
  });

  await insertRawRows({
    importFileId,
    rows: deduplicated.rows,
  });

  const rowsWithErrors = deduplicated.rows.filter(
    (row) => row.validationErrors.length > 0,
  ).length;
  const rowsWithWarnings = deduplicated.rows.filter(
    (row) => row.warnings.length > 0,
  ).length;

  const status = rowsWithErrors > 0 ? "error" : "validated";

  await updateImportFile({
    importFileId,
    status,
    rowCount: deduplicated.rows.length,
    metadata: {
      headers: parsedWorkbook.headers,
      templateName: template.name,
      sourceType: template.source_type,
      criticalErrors: [],
      structureWarnings: structureValidation.warnings,
      duplicateRows: deduplicated.duplicateRows,
      rowsWithErrors,
      rowsWithWarnings,
      normalizedAliasCount: financierAliases.filter((alias) => alias.normalizedAlias)
        .length,
    },
  });

  return {
    importFileId,
    criticalErrors: [],
    warnings: structureValidation.warnings,
    rowCount: deduplicated.rows.length,
    rowsWithErrors,
    rowsWithWarnings,
    duplicateRows: deduplicated.duplicateRows,
    status,
  };
}

export async function getImportTemplates() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(`Failed to load import templates: ${error.message}`);
  }

  return (data ?? []).map((record) => mapImportTemplate(record));
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
  }));

  const mappedRows = rawMappedRows.map((row) =>
    mapImportRow(row as Record<string, unknown>),
  );

  const rowsWithErrors = mappedRows.filter(
    (row) => row.validationErrors.length > 0,
  ).length;
  const rowsWithWarnings = mappedRows.filter(
    (row) => row.warnings.length > 0,
  ).length;
  const duplicateRows = mappedRows.filter((row) => row.isDuplicate).length;
  const importMetadata = (importFile.metadata as Record<string, unknown>) ?? {};
  const criticalErrors = Array.isArray(importMetadata.criticalErrors)
    ? (importMetadata.criticalErrors as string[])
    : [];

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
      rowsWithErrors,
      rowsWithWarnings,
      duplicateRows,
      criticalErrors,
      canProceedToConsolidation:
        criticalErrors.length === 0 && rowsWithErrors === 0,
    },
    rows: mappedRows,
  };
}
