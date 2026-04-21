import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ExpenseAllocationRecord,
  ExpenseCategoryRecord,
  ExpenseDetailData,
  ExpenseFilters,
  ExpenseListRecord,
  ExpensePageData,
  ExpenseRecurringTemplateRecord,
  ExpenseVisibilityScope,
} from "@/features/expenses/types";
import type { AppRole, DealerRow, ExpenseRow } from "@/types/database";

function mapAllocations(value: unknown): ExpenseAllocationRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((allocation) => {
    const current = allocation as Record<string, unknown> & {
      dealers?: { name?: string; code?: number } | null;
    };

    return {
      ...(current as unknown as ExpenseAllocationRecord),
      dealer_name: String(current.dealers?.name ?? ""),
      dealer_code:
        typeof current.dealers?.code === "number"
          ? current.dealers.code
          : Number(current.dealers?.code ?? 0),
    };
  });
}

function mapExpenseRecord(
  row: Record<string, unknown> & {
    expense_categories?: { name?: string } | null;
    expense_recurring_templates?: { name?: string } | null;
    expense_allocations?: unknown[];
  },
): ExpenseListRecord {
  return {
    ...(row as unknown as ExpenseRow),
    category_name:
      typeof row.expense_categories?.name === "string"
        ? row.expense_categories.name
        : null,
    recurring_template_name:
      typeof row.expense_recurring_templates?.name === "string"
        ? row.expense_recurring_templates.name
        : null,
    allocations: mapAllocations(row.expense_allocations),
    has_attachment: Boolean(row.attachment_path),
    attachment_url: null,
  };
}

function expenseVisibleToPartner(
  expense: ExpenseListRecord,
  scopes: ExpenseVisibilityScope[],
) {
  return expense.allocations.some((allocation) =>
    scopes.some((scope) => {
      if (scope.dealerId !== allocation.dealer_id) {
        return false;
      }

      return (
        expense.period_month >= scope.validFrom &&
        (scope.validTo === null || expense.period_month <= scope.validTo)
      );
    }),
  );
}

function filterExpenses(expenses: ExpenseListRecord[], filters: ExpenseFilters) {
  return expenses.filter((expense) => {
    if (filters.periodMonth && expense.period_month !== `${filters.periodMonth}-01`) {
      return false;
    }

    if (filters.categoryId && expense.category_id !== filters.categoryId) {
      return false;
    }

    if (filters.scopeType && expense.scope_type !== filters.scopeType) {
      return false;
    }

    if (
      filters.dealerId &&
      !expense.allocations.some((allocation) => allocation.dealer_id === filters.dealerId)
    ) {
      return false;
    }

    return true;
  });
}

async function getPartnerShareScopes(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dealer_partner_shares")
    .select("dealer_id, valid_from, valid_to, partners!inner(user_id)")
    .is("deleted_at", null)
    .eq("partners.user_id", profileId);

  if (error) {
    throw new Error(`Failed to load partner visibility scope: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    dealerId: String(row.dealer_id),
    validFrom: String(row.valid_from),
    validTo: row.valid_to ? String(row.valid_to) : null,
  }));
}

async function getLookupData(params: { profileId: string; role: AppRole }) {
  const supabase = createSupabaseAdminClient();
  const [
    { data: categoriesData, error: categoriesError },
    { data: dealersData, error: dealersError },
    { data: templatesData, error: templatesError },
  ] = await Promise.all([
    supabase
      .from("expense_categories")
      .select("*")
      .is("deleted_at", null)
      .order("name"),
    supabase.from("dealers").select("id, name, code").is("deleted_at", null).order("name"),
    supabase
      .from("expense_recurring_templates")
      .select("*, expense_categories(name)")
      .is("deleted_at", null)
      .order("name"),
  ]);

  if (categoriesError || dealersError || templatesError) {
    throw new Error("Failed to load expense lookups.");
  }

  let dealers = (dealersData ?? []) as Array<Pick<DealerRow, "id" | "name" | "code">>;

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    const allowedDealerIds = new Set(scopes.map((scope) => scope.dealerId));
    dealers = dealers.filter((dealer) => allowedDealerIds.has(dealer.id));
  }

  return {
    categories: (categoriesData ?? []) as ExpenseCategoryRecord[],
    dealers,
    templates: ((templatesData ?? []) as Array<Record<string, unknown>>).map(
      (template) =>
        ({
          ...(template as unknown as ExpenseRecurringTemplateRecord),
          category_name:
            typeof (template.expense_categories as { name?: string } | null)?.name ===
            "string"
              ? (template.expense_categories as { name?: string }).name ?? null
              : null,
        }) satisfies ExpenseRecurringTemplateRecord,
    ),
  };
}

async function maybeCreateAttachmentUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(env.expenseAttachmentBucketName)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export async function getExpensesPageData(params: {
  filters: ExpenseFilters;
  profileId: string;
  role: AppRole;
}): Promise<ExpensePageData> {
  const supabase = createSupabaseAdminClient();
  const lookups = await getLookupData(params);
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, expense_categories(name), expense_recurring_templates(name), expense_allocations(*, dealers(name, code))",
    )
    .is("deleted_at", null)
    .order("period_month", { ascending: false })
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load expenses: ${error.message}`);
  }

  let expenses = ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapExpenseRecord(
      row as Record<string, unknown> & {
        expense_categories?: { name?: string } | null;
        expense_recurring_templates?: { name?: string } | null;
        expense_allocations?: unknown[];
      },
    ),
  );

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    expenses = expenses.filter((expense) => expenseVisibleToPartner(expense, scopes));
  }

  return {
    expenses: filterExpenses(expenses, params.filters),
    filters: params.filters,
    categories: lookups.categories,
    dealers: lookups.dealers,
    templates: lookups.templates,
  };
}

export async function getExpenseDetailData(params: {
  expenseId: string;
  profileId: string;
  role: AppRole;
}): Promise<ExpenseDetailData> {
  const supabase = createSupabaseAdminClient();
  const lookups = await getLookupData(params);
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, expense_categories(name), expense_recurring_templates(name), expense_allocations(*, dealers(name, code))",
    )
    .eq("id", params.expenseId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error("Expense not found.");
  }

  const expense = mapExpenseRecord(
    data as Record<string, unknown> & {
      expense_categories?: { name?: string } | null;
      expense_recurring_templates?: { name?: string } | null;
      expense_allocations?: unknown[];
    },
  );

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    if (!expenseVisibleToPartner(expense, scopes)) {
      throw new Error("Expense not found.");
    }
  }

  expense.attachment_url = await maybeCreateAttachmentUrl(expense.attachment_path);

  return {
    expense,
    categories: lookups.categories,
    dealers: lookups.dealers,
    templates: lookups.templates,
  };
}
