import Link from "next/link";
import type { ExpenseListRecord } from "@/features/expenses/types";

export function ExpenseDetail({
  expense,
}: {
  expense: ExpenseListRecord;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Expense detail</p>
      <h2 style={{ marginTop: 0 }}>{expense.description}</h2>
      <div className="grid two">
        <div>
          <p className="eyebrow">Period</p>
          <p>{expense.period_month}</p>
        </div>
        <div>
          <p className="eyebrow">Expense date</p>
          <p>{expense.expense_date}</p>
        </div>
        <div>
          <p className="eyebrow">Category</p>
          <p>{expense.category_name ?? "-"}</p>
        </div>
        <div>
          <p className="eyebrow">Amount</p>
          <p>{expense.amount}</p>
        </div>
        <div>
          <p className="eyebrow">Scope</p>
          <p>{expense.scope_type}</p>
        </div>
        <div>
          <p className="eyebrow">Recurring template</p>
          <p>{expense.recurring_template_name ?? "-"}</p>
        </div>
      </div>
      {expense.attachment_url && (
        <div className="table-actions" style={{ marginTop: 20 }}>
          <Link className="ghost-button" href={expense.attachment_url} target="_blank">
            Open receipt
          </Link>
        </div>
      )}
    </section>
  );
}
