import type { DealRow, FinancierRow, PartnerRow, TableRow } from "@/types/database";

export interface DealFilters {
  periodMonth: string;
  dealerId: string;
  financierId: string;
  vin: string;
  make: string;
  model: string;
  isManuallyEdited: "all" | "yes" | "no";
  page: number;
}

export interface DealListRecord extends DealRow {
  dealer_name: string;
  dealer_code: number;
  financier_name: string | null;
}

export interface DealHistoryRecord extends TableRow<"deal_edit_history"> {
  changed_by_name: string | null;
  changed_by_email: string | null;
}

export interface DealsPageData {
  deals: DealListRecord[];
  filters: DealFilters;
  dealers: Array<Pick<DealListRecord, "dealer_id" | "dealer_name" | "dealer_code">>;
  financiers: Array<Pick<FinancierRow, "id" | "name">>;
  totalCount: number;
  totalPages: number;
  pageSize: number;
}

export interface DealDetailData {
  deal: DealListRecord;
  history: DealHistoryRecord[];
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<{ id: string; name: string }>;
}

export interface ConsolidationResultRow {
  sourceRowId: string;
  dealId: string | null;
  status: "consolidated" | "skipped" | "failed";
  message: string;
}

export interface ConsolidationSummary {
  consolidatedCount: number;
  skippedCount: number;
  failedCount: number;
  rows: ConsolidationResultRow[];
}

export interface PartnerShareScope {
  dealerId: string;
  validFrom: string;
  validTo: string | null;
}

export interface DealManualEditValues {
  id: string;
  dealerId: string;
  financierId: string;
  periodMonth: string;
  yearValue: number | null;
  makeValue: string;
  modelValue: string;
  vinValue: string;
  saleValue: string;
  netGrossValue: number;
  pickupValue: number | null;
}

export interface DealManualCreateValues {
  dealerId: string;
  financierId: string;
  periodMonth: string;
  yearValue: number | null;
  makeValue: string;
  modelValue: string;
  vinValue: string;
  saleValue: string;
  netGrossValue: number;
  pickupValue: number | null;
}

export interface DealPartnerVisibility {
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<{ id: string; name: string }>;
  shares: PartnerShareScope[];
  partners: PartnerRow[];
}
