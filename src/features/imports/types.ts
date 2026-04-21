export type ImportFileStatus =
  | "uploaded"
  | "validated"
  | "consolidated"
  | "error";

export type RowValidationStatus = "valid" | "warning" | "invalid";
export type RowDuplicateStatus =
  | "not_checked"
  | "unique"
  | "possible_duplicate"
  | "duplicate";
export type RowReviewStatus = "pending" | "approved" | "rejected";

export interface ImportTemplate {
  id: string;
  name: string;
  isActive: boolean;
  sourceType: string;
  columnSchema?: ImportTemplateColumn[];
}

export interface ImportFileSummary {
  id: string;
  sourceMonth: string;
  originalFilename: string;
  status: ImportFileStatus;
  rowCount: number;
  metadata?: Record<string, unknown>;
}

export interface ImportTemplateColumn {
  name: string;
  required: boolean;
}

export interface ImportIssue {
  code: string;
  message: string;
  field?: string;
  severity: "warning" | "error";
}

export interface ImportRowReview {
  id: string;
  rowNumber: number;
  originalPayload: Record<string, string | null>;
  normalizedPayload: Record<string, string | number | null>;
  validationErrors: ImportIssue[];
  warnings: ImportIssue[];
  isDuplicate: boolean;
  duplicateGroup: string | null;
  validationStatus: RowValidationStatus;
  duplicateStatus: RowDuplicateStatus;
  reviewStatus: RowReviewStatus;
  isReadyForConsolidation: boolean;
  detectedDealerName: string | null;
  detectedFinancierName: string | null;
}

export interface ImportReviewSummary {
  totalRows: number;
  rowsWithErrors: number;
  rowsWithWarnings: number;
  duplicateRows: number;
  criticalErrors: string[];
  canProceedToConsolidation: boolean;
}

export interface ImportReviewPayload {
  importFile: ImportFileSummary & {
    originalFilename: string;
    sourceMonth: string;
    metadata: Record<string, unknown>;
  };
  template: ImportTemplate;
  summary: ImportReviewSummary;
  rows: ImportRowReview[];
}
