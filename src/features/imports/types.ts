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

export interface ImportNormalizedPayload {
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

export interface ImportRowReview {
  id: string;
  rowNumber: number;
  originalPayload: Record<string, string | null>;
  normalizedPayload: ImportNormalizedPayload;
  validationErrors: ImportIssue[];
  warnings: ImportIssue[];
  isDuplicate: boolean;
  duplicateGroup: string | null;
  validationStatus: RowValidationStatus;
  duplicateStatus: RowDuplicateStatus;
  reviewStatus: RowReviewStatus;
  isReadyForConsolidation: boolean;
  detectedDealerId: string | null;
  detectedDealerName: string | null;
  detectedFinancierId: string | null;
  detectedFinancierName: string | null;
  isApprovable: boolean;
}

export interface ImportReviewSummary {
  totalRows: number;
  validRows: number;
  rowsWithErrors: number;
  rowsWithWarnings: number;
  duplicateRows: number;
  readyRows: number;
  approvedRows: number;
  pendingRows: number;
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

export interface ImportRowUpdatePayload {
  yearValue: number | null;
  makeValue: string;
  modelValue: string;
  vinValue: string;
  saleValue: number | null;
  financeRaw: string;
  netGrossValue: number | null;
  pickupValue: number | null;
}
