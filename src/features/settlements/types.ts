export type PaymentStatus = "pending" | "paid";
export type CalculationRunStatus = "draft" | "completed" | "failed";

export interface DealerMonthlyResult {
  id: string;
  dealerId: string;
  monthDate: string;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

export interface PartnerMonthlyResult {
  id: string;
  dealerId: string;
  partnerId: string;
  monthDate: string;
  percentageApplied: number;
  settlementAmount: number;
  paymentStatus: PaymentStatus;
}
