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
  normalizedPayload: NormalizedImportPayload;
  validationErrors: ImportIssue[];
  warnings: ImportIssue[];
  detectedFinancierId: string | null;
  detectedFinancierName: string | null;
  detectedDealerId: string | null;
  detectedDealerName: string | null;
  exactDuplicateKey: string;
  possibleDuplicateKey: string;
}

export interface NormalizedImportPayload {
  periodMonth: string;
  yearValue: number | null;
  makeValue: string | null;
  modelValue: string | null;
  vinValue: string | null;
  saleValue: number | null;
  financeRaw: string | null;
  financeNormalized: string | null;
  netGrossValue: number | null;
  pickupValue: number;
  assignedFinancierId: string | null;
  assignedFinancierName: string | null;
  assignedDealerId: string | null;
  assignedDealerName: string | null;
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

export interface DuplicateDetectionRecord {
  id?: string;
  exactDuplicateKey: string;
  possibleDuplicateKey: string;
}

export interface MatchingResult {
  detectedFinancierId: string | null;
  detectedFinancierName: string | null;
  detectedDealerId: string | null;
  detectedDealerName: string | null;
  warnings: ImportIssue[];
}
