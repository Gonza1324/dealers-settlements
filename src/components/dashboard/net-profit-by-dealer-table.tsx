import type { DealerPerformanceRecord, ExpenseByDealerRecord } from "@/features/dashboard/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function NetProfitByDealerTable({
  title,
  rows,
}: {
  title: string;
  rows: DealerPerformanceRecord[];
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Report</p>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th>Gross</th>
              <th>Expenses</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dealerId}>
                <td>
                  <strong>{row.dealerName}</strong>
                  <div className="muted small-text">#{row.dealerCode}</div>
                </td>
                <td>{formatCurrency(row.grossProfitTotal)}</td>
                <td>{formatCurrency(row.expenseTotal)}</td>
                <td>{formatCurrency(row.netProfitTotal)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="muted" colSpan={4}>
                  No dealer results available for this filter set.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ExpenseByDealerTable({
  rows,
}: {
  rows: ExpenseByDealerRecord[];
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Report</p>
      <h2 style={{ marginTop: 0 }}>Expenses by dealer</h2>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th>Expense total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dealerId}>
                <td>
                  <strong>{row.dealerName}</strong>
                  <div className="muted small-text">#{row.dealerCode}</div>
                </td>
                <td>{formatCurrency(row.expenseTotal)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="muted" colSpan={2}>
                  No expense allocations available for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
