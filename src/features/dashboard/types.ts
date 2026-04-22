import type { AppRole, PaymentStatus } from "@/types/database";

export type DashboardFilters = {
  periodMonth: string;
  dealerId: string;
  financierId: string;
  paymentStatus: "" | PaymentStatus;
};

export type DashboardOption = {
  id: string;
  label: string;
};

export type DashboardMetric = {
  label: string;
  value: number;
  helper: string;
};

export type DealerPerformanceRecord = {
  dealerId: string;
  dealerName: string;
  dealerCode: number;
  grossProfitTotal: number;
  expenseTotal: number;
  netProfitTotal: number;
};

export type ExpenseByDealerRecord = {
  dealerId: string;
  dealerName: string;
  dealerCode: number;
  expenseTotal: number;
};

export type TopFinancierRecord = {
  financierId: string;
  financierName: string;
  contributionTotal: number;
  dealCount: number;
};

export type DashboardPayoutRecord = {
  payoutId: string | null;
  dealerId: string;
  dealerName: string;
  dealerCode: number;
  partnerId: string;
  partnerName: string;
  periodMonth: string;
  partnerAmount: number;
  paymentStatus: PaymentStatus;
  paidAmount: number | null;
  paidAt: string | null;
};

export type MonthlyComparisonPoint = {
  periodMonth: string;
  grossProfitTotal: number;
  expenseTotal: number;
  netProfitTotal: number;
};

export type DealerDetailDealRecord = {
  id: string;
  source: "deal" | "dead_deal";
  date: string;
  vin: string;
  financierName: string | null;
  grossAmount: number;
  expenseAmount: number;
  netAmount: number;
};

export type DealerDetailExpenseRecord = {
  expenseId: string;
  expenseDate: string;
  description: string;
  categoryName: string | null;
  allocatedAmount: number;
};

export type DealerDetailPartnerRecord = {
  partnerId: string;
  partnerName: string;
  sharePercentage: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paidAmount: number | null;
};

export type DealerDetailReport = {
  dealerId: string;
  dealerName: string;
  dealerCode: number;
  grossProfitTotal: number;
  expenseTotal: number;
  netProfitTotal: number;
  deals: DealerDetailDealRecord[];
  expenses: DealerDetailExpenseRecord[];
  partnerDistribution: DealerDetailPartnerRecord[];
};

export type PartnerDealerSnapshot = {
  dealerId: string;
  dealerName: string;
  dealerCode: number;
  netProfitTotal: number;
  expenseTotal: number;
};

export type DashboardSummary = {
  totalNetProfit: number;
  totalExpense: number;
  totalGrossProfit: number;
  visibleDealerCount: number;
  pendingPayoutCount: number;
  paidPayoutCount: number;
  pendingPayoutAmount: number;
  paidPayoutAmount: number;
};

export type DashboardPageData = {
  role: AppRole;
  filters: DashboardFilters;
  dealerOptions: DashboardOption[];
  financierOptions: DashboardOption[];
  summary: DashboardSummary;
  dealerPerformance: DealerPerformanceRecord[];
  expenseByDealer: ExpenseByDealerRecord[];
  payoutRows: DashboardPayoutRecord[];
  topFinanciers: TopFinancierRecord[];
  comparison: MonthlyComparisonPoint[];
  bestDealers: DealerPerformanceRecord[];
  worstDealers: DealerPerformanceRecord[];
  quickSettlementHref: string;
  dealerDetail: DealerDetailReport | null;
  partnerDealers: PartnerDealerSnapshot[];
  partnerName: string | null;
};
