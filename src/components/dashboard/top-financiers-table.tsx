import type { TopFinancierRecord } from "@/features/dashboard/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function TopFinanciersTable({
  rows,
}: {
  rows: TopFinancierRecord[];
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Report</p>
      <h2 style={{ marginTop: 0 }}>Top financiers</h2>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Financier</th>
              <th>Deals</th>
              <th>Contribution</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.financierId}>
                <td>{row.financierName}</td>
                <td>{row.dealCount}</td>
                <td>{formatCurrency(row.contributionTotal)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="muted" colSpan={3}>
                  No financier activity available for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
