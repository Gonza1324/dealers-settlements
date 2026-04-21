import type {
  CalculationRunStatus,
  DealerMonthlyResultRow,
  MonthlyCalculationRunRow,
  PartnerMonthlyPayoutRow,
  PartnerMonthlyResultRow,
  PaymentStatus,
  TableRow,
} from "@/types/database";

export interface SettlementFilters {
  periodMonth: string;
}

export interface MonthlyRunSummary {
  dealersCalculated: number;
  partnersCalculated: number;
  grossTotal: number;
  expenseTotal: number;
  netTotal: number;
  errorCount: number;
}

export interface MonthlyRunError {
  dealerId: string | null;
  dealerName: string | null;
  message: string;
}

export interface MonthlyCalculationRunRecord
  extends Omit<MonthlyCalculationRunRow, "summary_json" | "error_messages"> {
  summary_json: MonthlyRunSummary;
  error_messages: MonthlyRunError[];
  triggered_by_name: string | null;
  triggered_by_email: string | null;
}

export interface DealerMonthlyResultRecord extends DealerMonthlyResultRow {
  dealer_name: string;
  dealer_code: number;
}

export interface PartnerMonthlyResultRecord extends PartnerMonthlyResultRow {
  dealer_name: string;
  dealer_code: number;
  partner_name: string;
  partner_user_email: string | null;
  payout_id: string | null;
  payout_status: PaymentStatus;
  paid_amount: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_note: string | null;
  payment_attachment_path: string | null;
  payment_attachment_url: string | null;
}

export interface PartnerMonthlyPayoutRecord extends PartnerMonthlyPayoutRow {
  dealer_name: string;
  dealer_code: number;
  partner_name: string;
  partner_user_email: string | null;
  payment_attachment_url: string | null;
}

export interface SettlementPageData {
  runs: MonthlyCalculationRunRecord[];
  currentRun: MonthlyCalculationRunRecord | null;
  currentDealerResults: DealerMonthlyResultRecord[];
  currentPartnerResults: PartnerMonthlyResultRecord[];
  filters: SettlementFilters;
}

export interface SettlementRunDetailData {
  run: MonthlyCalculationRunRecord;
  dealerResults: DealerMonthlyResultRecord[];
  partnerResults: PartnerMonthlyResultRecord[];
}

export interface RunCalculationResult {
  runId: string;
  status: CalculationRunStatus;
  summary: MonthlyRunSummary;
  errors: MonthlyRunError[];
}

export interface DealerShareResolution {
  dealerId: string;
  dealerName: string;
  shares: Array<{
    partnerId: string;
    partnerName: string;
    percentage: number;
  }>;
  totalPercentage: number;
  isValid: boolean;
}

export type SettlementPaymentFormValues = {
  payoutId: string;
  paymentStatus: PaymentStatus;
  paidAmount: string;
  paidAt: string;
  paymentMethod: string;
  paymentNote: string;
  existingAttachmentPath: string;
  removeAttachment: boolean;
};

export type SettlementPartnerScope = {
  dealerId: string;
  validFrom: string;
  validTo: string | null;
};

export type RunSummaryJson = MonthlyRunSummary;

export type MonthlyCalculationRunTable = TableRow<"monthly_calculation_runs">;
