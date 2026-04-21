import type {
  DealerRow,
  DealerStatus,
  FinancierRow,
  PartnerRow,
  ProfileRow,
  TableRow,
} from "@/types/database";

export interface DealerWithShareAlert extends DealerRow {
  currentShareTotal: number;
  shareAlert: boolean;
}

export interface DealerShareRecord extends TableRow<"dealer_partner_shares"> {
  dealer_name: string;
  partner_name: string;
}

export interface DealerAssignmentRecord
  extends TableRow<"dealer_financier_assignments"> {
  dealer_name: string;
  financier_name: string;
}

export interface DealersPageData {
  dealers: DealerWithShareAlert[];
  shares: DealerShareRecord[];
  assignments: DealerAssignmentRecord[];
  partners: PartnerRow[];
  financiers: FinancierRow[];
  profiles: ProfileRow[];
}

export interface DealerFormValues {
  id?: string;
  code: number;
  name: string;
  status: DealerStatus;
}
