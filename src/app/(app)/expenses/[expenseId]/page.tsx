import Link from "next/link";
import { ExpenseAllocationsTable } from "@/components/expenses/expense-allocations-table";
import { ExpenseDetail } from "@/components/expenses/expense-detail";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/ui/page-header";
import { getExpenseDetailData } from "@/features/expenses/queries";
import { requireExpenseAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const profile = await requireExpenseAccess();
  const { expenseId } = await params;
  const data = await getExpenseDetailData({
    expenseId,
    profileId: profile.id,
    role: profile.role,
  });

  const canManage = profile.role === "super_admin" || profile.role === "expense_admin";

  return (
    <>
      <PageHeader
        eyebrow="Expense detail"
        title={data.expense.description}
        description={`Period ${data.expense.period_month}. ${data.expense.allocations.length} dealer allocations generated for ${data.expense.scope_type}.`}
      />
      <div className="table-actions" style={{ marginBottom: 24 }}>
        <Link className="ghost-button" href="/expenses">
          Back to expenses
        </Link>
      </div>
      <div className="grid two">
        <ExpenseDetail expense={data.expense} />
        <ExpenseAllocationsTable allocations={data.expense.allocations} />
      </div>
      {canManage && (
        <div style={{ marginTop: 24 }}>
          <ExpenseForm
            canEdit
            categories={data.categories}
            dealers={data.dealers}
            expense={data.expense}
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
        </div>
      )}
    </>
  );
}
