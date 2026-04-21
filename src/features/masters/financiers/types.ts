import type {
  FinancierRow,
  TableRow,
} from "@/types/database";

export interface FinancierAliasRecord extends TableRow<"financier_aliases"> {
  financier_name: string;
}

export interface FinanciersPageData {
  financiers: FinancierRow[];
  aliases: FinancierAliasRecord[];
}
