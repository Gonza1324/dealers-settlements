import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { archiveExpense } from "@/features/expenses/actions";
import type { ExpenseListRecord } from "@/features/expenses/types";

export function ExpensesTable({
  expenses,
  canManage,
}: {
  expenses: ExpenseListRecord[];
  canManage: boolean;
}) {
  if (expenses.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="No expenses match these filters"
          description="Try a different month, category or dealer to find recorded expenses."
        />
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="masters-section-header">
        <div>
          <p className="eyebrow">Expense registry</p>
          <h2 style={{ marginTop: 0 }}>{expenses.length} expenses</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            Allocations are generated automatically in equal parts across the selected
            dealers.
          </p>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "period", label: "Period" },
          { key: "date", label: "Expense date" },
          { key: "category", label: "Category" },
          { key: "description", label: "Description" },
          { key: "amount", label: "Amount" },
          { key: "scope", label: "Scope" },
          { key: "allocations", label: "Allocations" },
          { key: "attachment", label: "Receipt" },
          { key: "actions", label: "Actions" },
        ]}
      >
        {expenses.map((expense) => (
          <tr key={expense.id}>
            <td>{expense.period_month}</td>
            <td>{expense.expense_date}</td>
            <td>{expense.category_name ?? "-"}</td>
            <td>
              <strong>{expense.description}</strong>
              {expense.recurring_template_name && (
                <div className="muted small-text">
                  Template: {expense.recurring_template_name}
                </div>
              )}
            </td>
            <td>{expense.amount}</td>
            <td>
              <StatusPill tone="muted">{expense.scope_type}</StatusPill>
            </td>
            <td>
              <div className="muted small-text">
                {expense.allocations.length} dealers
              </div>
              <div className="muted small-text">
                {expense.allocations
                  .map((allocation) => allocation.dealer_name)
                  .slice(0, 3)
                  .join(", ") || "-"}
              </div>
            </td>
            <td>{expense.has_attachment ? "Attached" : "-"}</td>
            <td>
              <div className="table-actions">
                <Link className="ghost-button" href={`/expenses/${expense.id}`}>
                  View detail
                </Link>
                {canManage && (
                  <form action={archiveExpense.bind(null, expense.id)}>
                    <button className="ghost-button danger" type="submit">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
