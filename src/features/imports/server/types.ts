import type {
  ImportIssue,
  ImportReviewPayload,
} from "@/features/imports/types";

export interface ParsedWorkbook {
  headers: string[];
  rows: Record<string, string | null>[];
}

export interface NormalizedImportRow {
  rowNumber: number;
  originalPayload: Record<string, string | null>;
  normalizedPayload: Record<string, string | number | null>;
  validationErrors: ImportIssue[];
  warnings: ImportIssue[];
  detectedFinancierId: string | null;
  detectedFinancierName: string | null;
  detectedDealerId: string | null;
  detectedDealerName: string | null;
  duplicateKey: string;
}

export interface ImportExecutionResult {
  importFileId: string;
  criticalErrors: string[];
  warnings: string[];
  rowCount: number;
  rowsWithErrors: number;
  rowsWithWarnings: number;
  duplicateRows: number;
  status: string;
}

export interface FinancierAliasLookup {
  financierId: string;
  financierName: string;
  normalizedAlias: string;
}

export interface DealerFinancierAssignmentLookup {
  financierId: string;
  dealerId: string;
  dealerName: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface ImportTemplateRecord {
  id: string;
  name: string;
  source_type: string;
  expected_headers: string[];
  column_map_json: Record<string, string>;
  is_active: boolean;
}

export type ImportReviewRecord = ImportReviewPayload;
