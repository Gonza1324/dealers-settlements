import type { DealerDetailReport as DealerDetailReportData } from "@/features/dashboard/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function DealerDetailReport({
  report,
  role,
}: {
  report: DealerDetailReportData | null;
  role: "super_admin" | "partner_viewer";
}) {
  if (!report) {
    return null;
  }

  return (
    <section className="panel">
      <p className="eyebrow">Dealer detail</p>
      <h2 style={{ marginTop: 0 }}>
        {report.dealerName} {report.dealerCode > 0 ? `#${report.dealerCode}` : ""}
      </h2>

      <div className="grid three" style={{ marginBottom: 20 }}>
        <article className="dashboard-mini-card">
          <span className="muted">Gross</span>
          <strong>{formatCurrency(report.grossProfitTotal)}</strong>
        </article>
        <article className="dashboard-mini-card">
          <span className="muted">Expenses</span>
          <strong>{formatCurrency(report.expenseTotal)}</strong>
        </article>
        <article className="dashboard-mini-card">
          <span className="muted">Net</span>
          <strong>{formatCurrency(report.netProfitTotal)}</strong>
        </article>
      </div>

      <div className="grid two">
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Deals</th>
                <th>Date</th>
                <th>Financier</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {report.deals.map((deal) => (
                <tr key={`${deal.source}-${deal.id}`}>
                  <td>
                    <strong>{deal.vin}</strong>
                    <div className="muted small-text">
                      {deal.source === "dead_deal" ? "Dead deal" : "Deal"}
                    </div>
                  </td>
                  <td>{deal.date}</td>
                  <td>{deal.financierName ?? "-"}</td>
                  <td>{formatCurrency(deal.netAmount)}</td>
                </tr>
              ))}
              {report.deals.length === 0 && (
                <tr>
                  <td className="muted" colSpan={4}>
                    No deals registered for this dealer in the selected month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Expenses</th>
                <th>Date</th>
                <th>Category</th>
                <th>Allocated</th>
              </tr>
            </thead>
            <tbody>
              {report.expenses.map((expense) => (
                <tr key={expense.expenseId}>
                  <td>{expense.description}</td>
                  <td>{expense.expenseDate}</td>
                  <td>{expense.categoryName ?? "-"}</td>
                  <td>{formatCurrency(expense.allocatedAmount)}</td>
                </tr>
              ))}
              {report.expenses.length === 0 && (
                <tr>
                  <td className="muted" colSpan={4}>
                    No expenses allocated to this dealer in the selected month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-table-wrapper" style={{ marginTop: 20 }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{role === "super_admin" ? "Partner" : "Your payout"}</th>
              <th>Share %</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.partnerDistribution.map((partner) => (
              <tr key={partner.partnerId}>
                <td>{partner.partnerName}</td>
                <td>{partner.sharePercentage.toFixed(2)}%</td>
                <td>{formatCurrency(partner.amount)}</td>
                <td>
                  <span
                    className={`status-pill ${
                      partner.paymentStatus === "paid" ? "success" : "warning"
                    }`}
                  >
                    {partner.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {report.partnerDistribution.length === 0 && (
              <tr>
                <td className="muted" colSpan={4}>
                  No payout distribution available for this dealer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
