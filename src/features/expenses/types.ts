import type {
  DealerRow,
  ExpenseAllocationRow,
  ExpenseRow,
  ExpenseScopeType,
  FinancierRow,
  PartnerRow,
  TableRow,
} from "@/types/database";

export interface ExpenseFilters {
  periodMonth: string;
  categoryId: string;
  dealerId: string;
  scopeType: "" | ExpenseScopeType;
}

export interface ExpenseAllocationRecord extends ExpenseAllocationRow {
  dealer_name: string;
  dealer_code: number;
}

export interface ExpenseListRecord extends ExpenseRow {
  category_name: string | null;
  recurring_template_name: string | null;
  allocations: ExpenseAllocationRecord[];
  has_attachment: boolean;
  attachment_url: string | null;
}

export type ExpenseCategoryRecord = TableRow<"expense_categories">;

export interface ExpenseRecurringTemplateRecord
  extends TableRow<"expense_recurring_templates"> {
  category_name: string | null;
}

export interface ExpensePageData {
  expenses: ExpenseListRecord[];
  filters: ExpenseFilters;
  categories: ExpenseCategoryRecord[];
  dealers: Array<Pick<DealerRow, "id" | "name" | "code">>;
  templates: ExpenseRecurringTemplateRecord[];
}

export interface ExpenseDetailData {
  expense: ExpenseListRecord;
  categories: ExpenseCategoryRecord[];
  dealers: Array<Pick<DealerRow, "id" | "name" | "code">>;
  templates: ExpenseRecurringTemplateRecord[];
}

export interface ExpenseFormTemplateOption {
  id: string;
  name: string;
  categoryId: string | null;
  defaultDescription: string | null;
  defaultAmount: number;
  scopeType: ExpenseScopeType;
  selectedDealerIds: string[];
  isActive: boolean;
}

export interface ExpenseCategoryOption {
  id: string;
  name: string;
}

export interface ExpenseDealerOption {
  id: string;
  name: string;
  code: number;
}

export interface ExpenseTargetDealer {
  id: string;
  name: string;
  code: number;
}

export interface ExpenseAllocationDraft {
  dealerId: string;
  allocatedAmount: number;
}

export interface ExpenseFormValues {
  id?: string;
  recurringTemplateId: string;
  categoryId: string;
  description: string;
  amount: string;
  expenseDate: string;
  periodMonth: string;
  scopeType: ExpenseScopeType;
  singleDealerId: string;
  selectedDealerIds: string[];
  removeAttachment: boolean;
  existingAttachmentPath: string;
  isRecurringInstance: boolean;
}

export interface ExpenseVisibilityScope {
  dealerId: string;
  validFrom: string;
  validTo: string | null;
}

export interface ExpensePartnerVisibility {
  dealers: Array<Pick<DealerRow, "id" | "name" | "code">>;
  financiers: Array<Pick<FinancierRow, "id" | "name">>;
  shares: ExpenseVisibilityScope[];
  partners: PartnerRow[];
}
