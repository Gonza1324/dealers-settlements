export type DealerStatus = "active" | "inactive";

export interface DealerSummary {
  id: string;
  name: string;
  code: number;
  status: DealerStatus;
  isArchived: boolean;
}

export interface PartnerSummary {
  id: string;
  fullName: string;
  email: string | null;
  isActive: boolean;
}

export interface DealerPartnerShare {
  id: string;
  dealerId: string;
  partnerId: string;
  percentage: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface FinancierSummary {
  id: string;
  legalName: string;
  isActive: boolean;
}

