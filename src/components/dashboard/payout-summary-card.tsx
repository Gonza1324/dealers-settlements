import type { DashboardPayoutRecord } from "@/features/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";
import { payoutStatusTone } from "@/lib/utils/payout-status";

type PayoutBreakdownRow = {
  key: string;
  label: string;
  helper?: string;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  payoutCount: number;
};

function addToBreakdown(
  groups: Map<string, PayoutBreakdownRow>,
  key: string,
  label: string,
  row: DashboardPayoutRecord,
  helper?: string,
) {
  const current =
    groups.get(key) ??
    ({
      key,
      label,
      helper,
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      payoutCount: 0,
    } satisfies PayoutBreakdownRow);
  const paidAmount =
    row.paymentStatus === "paid"
      ? row.paidAmount ?? row.partnerAmount
      : row.paidAmount ?? 0;
  const pendingAmount = Math.max(0, row.partnerAmount - paidAmount);

  current.totalAmount += row.partnerAmount;
  current.payoutCount += 1;
  current.paidAmount += paidAmount;
  current.pendingAmount += pendingAmount;

  groups.set(key, current);
}

function buildBreakdowns(rows: DashboardPayoutRecord[]) {
  const byPartner = new Map<string, PayoutBreakdownRow>();
  const byDealer = new Map<string, PayoutBreakdownRow>();
  const byMonth = new Map<string, PayoutBreakdownRow>();

  for (const row of rows) {
    addToBreakdown(byPartner, row.partnerId, row.partnerName, row);
    addToBreakdown(
      byDealer,
      row.dealerId,
      row.dealerName,
      row,
      `#${row.dealerCode}`,
    );
    addToBreakdown(byMonth, row.periodMonth, row.periodMonth.slice(0, 7), row);
  }

  const byAmount = (left: PayoutBreakdownRow, right: PayoutBreakdownRow) =>
    right.totalAmount - left.totalAmount || left.label.localeCompare(right.label);

  return {
    byPartner: [...byPartner.values()].sort(byAmount),
    byDealer: [...byDealer.values()].sort(byAmount),
    byMonth: [...byMonth.values()].sort((left, right) =>
      right.key.localeCompare(left.key),
    ),
  };
}

function BreakdownTable({
  rows,
  title,
}: {
  rows: PayoutBreakdownRow[];
  title: string;
}) {
  return (
    <article className="payout-breakdown-card">
      <h3>{title}</h3>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table payout-breakdown-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="numeric">Total</th>
              <th className="numeric">Pending</th>
              <th className="numeric">Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const paidPercent =
                row.totalAmount > 0
                  ? Math.round((row.paidAmount / row.totalAmount) * 100)
                  : 0;
              const pendingPercent =
                row.totalAmount > 0
                  ? Math.max(0, 100 - paidPercent)
                  : 0;

              return (
                <tr key={row.key}>
                  <td>
                    <strong>{row.label}</strong>
                    <div className="muted small-text">
                      {row.helper ? `${row.helper} · ` : ""}
                      {row.payoutCount} payouts
                    </div>
                    <div
                      aria-label={`${paidPercent}% paid and ${pendingPercent}% pending`}
                      className="payout-mix-track"
                    >
                      <span
                        className="payout-mix-segment paid"
                        style={{ width: `${paidPercent}%` }}
                      />
                      <span
                        className="payout-mix-segment pending"
                        style={{ width: `${pendingPercent}%` }}
                      />
                    </div>
                  </td>
                  <td className="strong-numeric">{formatCurrency(row.totalAmount)}</td>
                  <td className="numeric">{formatCurrency(row.pendingAmount)}</td>
                  <td className="numeric">{formatCurrency(row.paidAmount)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="muted" colSpan={4}>
                  No payout rows available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function PayoutSummaryCard({
  rows,
  title,
}: {
  rows: DashboardPayoutRecord[];
  title: string;
}) {
  const breakdowns = buildBreakdowns(rows);
  const totalAmount = rows.reduce((sum, row) => sum + row.partnerAmount, 0);
  const pendingAmount = rows
    .reduce((sum, row) => sum + Math.max(0, row.partnerAmount - (row.paidAmount ?? 0)), 0);
  const paidAmount = rows
    .reduce(
      (sum, row) =>
        sum +
        (row.paymentStatus === "paid"
          ? row.paidAmount ?? row.partnerAmount
          : row.paidAmount ?? 0),
      0,
    );

  return (
    <section className="panel payout-summary-panel">
      <p className="eyebrow">Payments</p>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      <div className="payout-total-strip">
        <article className="total">
          <span className="muted small-text">Total</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </article>
        <article className="pending">
          <span className="muted small-text">Pending</span>
          <strong>{formatCurrency(pendingAmount)}</strong>
        </article>
        <article className="paid">
          <span className="muted small-text">Paid</span>
          <strong>{formatCurrency(paidAmount)}</strong>
        </article>
      </div>

      <div className="payout-breakdown-grid">
        <BreakdownTable rows={breakdowns.byPartner} title="By partner" />
        <BreakdownTable rows={breakdowns.byDealer} title="By dealer" />
        <BreakdownTable rows={breakdowns.byMonth} title="By month" />
      </div>

      <div className="dashboard-table-wrapper registry-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th>Month</th>
              <th>Partner</th>
              <th className="numeric">Amount</th>
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
                <td>{row.periodMonth.slice(0, 7)}</td>
                <td>{row.partnerName}</td>
                <td className="strong-numeric">{formatCurrency(row.partnerAmount)}</td>
                <td>
                  <span
                    className={`status-pill ${payoutStatusTone(row.paymentStatus)}`}
                  >
                    {row.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="muted" colSpan={5}>
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
