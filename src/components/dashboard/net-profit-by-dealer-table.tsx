import type { DealerPerformanceRecord, ExpenseByDealerRecord } from "@/features/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";

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
      <div className="dashboard-table-wrapper registry-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th className="numeric">Gross</th>
              <th className="numeric">Expenses</th>
              <th className="numeric">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dealerId}>
                <td>
                  <strong>{row.dealerName}</strong>
                  <div className="muted small-text">#{row.dealerCode}</div>
                </td>
                <td className="numeric">{formatCurrency(row.grossProfitTotal)}</td>
                <td className="numeric">{formatCurrency(row.expenseTotal)}</td>
                <td className="strong-numeric">{formatCurrency(row.netProfitTotal)}</td>
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
      <div className="dashboard-table-wrapper registry-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th className="numeric">Expense total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dealerId}>
                <td>
                  <strong>{row.dealerName}</strong>
                  <div className="muted small-text">#{row.dealerCode}</div>
                </td>
                <td className="strong-numeric">{formatCurrency(row.expenseTotal)}</td>
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
