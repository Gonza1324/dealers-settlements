import type { Database as SupabaseDatabase } from "@/types/supabase";
export type { Json } from "@/types/supabase";

export type Database = SupabaseDatabase;

export type PublicSchema = Database["public"];
export type DbTables = PublicSchema["Tables"];
export type DbViews = PublicSchema["Views"];
export type DbFunctions = PublicSchema["Functions"];
export type DbEnums = PublicSchema["Enums"];

export type TableName = keyof DbTables;
export type EnumName = keyof DbEnums;

export type TableRow<T extends TableName> = DbTables[T]["Row"];
export type TableInsert<T extends TableName> = DbTables[T]["Insert"];
export type TableUpdate<T extends TableName> = DbTables[T]["Update"];
export type DbEnum<T extends EnumName> = DbEnums[T];

export type ProfileRow = TableRow<"profiles">;
export type DealerRow = TableRow<"dealers">;
export type PartnerRow = TableRow<"partners">;
export type FinancierRow = TableRow<"financiers">;
export type ImportTemplateRow = TableRow<"import_templates">;
export type ImportFileRow = TableRow<"import_files">;
export type RawDealRow = TableRow<"raw_deal_rows">;
export type DealRow = TableRow<"deals">;
export type DeadDealRow = TableRow<"dead_deals">;
export type ExpenseRow = TableRow<"expenses">;
export type ExpenseAllocationRow = TableRow<"expense_allocations">;
export type MonthlyCalculationRunRow = TableRow<"monthly_calculation_runs">;
export type DealerMonthlyResultRow = TableRow<"dealer_monthly_results">;
export type PartnerMonthlyResultRow = TableRow<"partner_monthly_results">;
export type PartnerMonthlyPayoutRow = TableRow<"partner_monthly_payouts">;

export type AppRole = DbEnum<"app_role">;
export type DealerStatus = DbEnum<"dealer_status">;
export type ImportFileStatus = DbEnum<"import_file_status">;
export type RowValidationStatus = DbEnum<"row_validation_status">;
export type RowDuplicateStatus = DbEnum<"row_duplicate_status">;
export type RowReviewStatus = DbEnum<"row_review_status">;
export type ExpenseScopeType = DbEnum<"expense_scope_type">;
export type CalculationRunStatus = DbEnum<"calculation_run_status">;
export type PaymentStatus = DbEnum<"payment_status">;
