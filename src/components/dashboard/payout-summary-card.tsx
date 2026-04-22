import type { DashboardPayoutRecord } from "@/features/dashboard/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function PayoutSummaryCard({
  rows,
  title,
}: {
  rows: DashboardPayoutRecord[];
  title: string;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Payments</p>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th>Partner</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.dealerId}-${row.partnerId}-${row.periodMonth}`}>
                <td>
                  <strong>{row.dealerName}</strong>
                  <div className="muted small-text">#{row.dealerCode}</div>
                </td>
                <td>{row.partnerName}</td>
                <td>{formatCurrency(row.partnerAmount)}</td>
                <td>
                  <span
                    className={`status-pill ${
                      row.paymentStatus === "paid" ? "success" : "warning"
                    }`}
                  >
                    {row.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="muted" colSpan={4}>
                  No payout rows available for this filter set.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
