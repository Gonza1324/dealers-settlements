import type { DeadDealRow, FinancierRow } from "@/types/database";

export interface DeadDealFilters {
  periodMonth: string;
  dealerId: string;
  financierId: string;
  vin: string;
}

export interface DeadDealListRecord extends DeadDealRow {
  dealer_name: string;
  dealer_code: number;
  financier_name: string;
}

export interface DeadDealsPageData {
  deadDeals: DeadDealListRecord[];
  filters: DeadDealFilters;
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<Pick<FinancierRow, "id" | "name">>;
}

export interface DeadDealDetailData {
  deadDeal: DeadDealListRecord;
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<{ id: string; name: string }>;
}

export interface DeadDealVisibilityScope {
  dealerId: string;
  validFrom: string;
  validTo: string | null;
}
