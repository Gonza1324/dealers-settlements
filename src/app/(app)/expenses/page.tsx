import { ExpenseCategoriesPanel } from "@/components/expenses/expense-categories-panel";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpensesFilters } from "@/components/expenses/expenses-filters";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { RecurringTemplatesPanel } from "@/components/expenses/recurring-templates-panel";
import { expenseFiltersSchema } from "@/features/expenses/schema";
import { getExpensesPageData } from "@/features/expenses/queries";
import { requireExpenseAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireExpenseAccess();
  const rawSearchParams = await searchParams;
  const filters = expenseFiltersSchema.parse({
    periodMonth:
      typeof rawSearchParams.periodMonth === "string"
        ? rawSearchParams.periodMonth
        : "",
    categoryId:
      typeof rawSearchParams.categoryId === "string" ? rawSearchParams.categoryId : "",
    dealerId: typeof rawSearchParams.dealerId === "string" ? rawSearchParams.dealerId : "",
    scopeType:
      typeof rawSearchParams.scopeType === "string" ? rawSearchParams.scopeType : "",
  });

  const data = await getExpensesPageData({
    filters,
    profileId: profile.id,
    role: profile.role,
  });

  const canManage = profile.role === "super_admin" || profile.role === "expense_admin";

  return (
    <>
      <ExpensesFilters
        categories={data.categories}
        dealers={data.dealers}
        filters={data.filters}
      />
      <ExpensesTable canManage={canManage} expenses={data.expenses} />
      {canManage && (
        <>
          <div className="grid two" style={{ marginTop: 24 }}>
            <ExpenseForm
              canEdit
              categories={data.categories}
              dealers={data.dealers}
              templates={data.templates.map((template) => ({
                id: template.id,
                name: template.name,
                categoryId: template.category_id,
                defaultDescription: template.default_description,
                defaultAmount: Number(template.default_amount),
                scopeType: template.scope_type,
                selectedDealerIds: Array.isArray(template.selected_dealer_ids)
                  ? (template.selected_dealer_ids as string[])
                  : [],
                isActive: template.is_active,
              }))}
            />
            <div className="grid" style={{ gap: 24 }}>
              <ExpenseCategoriesPanel categories={data.categories} />
              <RecurringTemplatesPanel
                categories={data.categories}
                dealers={data.dealers}
                templates={data.templates}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
