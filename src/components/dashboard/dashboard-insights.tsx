import type { DashboardPageData } from "@/features/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function dividePercent(numerator: number, denominator: number) {
  if (denominator === 0) {
    return null;
  }

  return (numerator / denominator) * 100;
}

export function DashboardInsights({ data }: { data: DashboardPageData }) {
  const payoutCount = data.summary.pendingPayoutCount + data.summary.paidPayoutCount;
  const payoutAmount = data.summary.pendingPayoutAmount + data.summary.paidPayoutAmount;
  const paidPayoutPercent = dividePercent(data.summary.paidPayoutCount, payoutCount);
  const netMarginPercent = dividePercent(
    data.summary.totalNetProfit,
    data.summary.totalGrossProfit,
  );
  const activityCount = data.summary.dealCount + data.summary.deadDealCount;
  const largestExpenseDealer = data.expenseByDealer[0] ?? null;

  return (
    <section className="dashboard-insight-grid">
      <article className="dashboard-insight-card">
        <span className="small-text muted">Net margin</span>
        <strong>
          {netMarginPercent === null ? "-" : `${formatPercent(netMarginPercent)}%`}
        </strong>
        <p>
          {formatCurrency(data.summary.totalNetProfit)} net from{" "}
          {formatCurrency(data.summary.totalGrossProfit)} gross.
        </p>
      </article>
      <article className="dashboard-insight-card">
        <span className="small-text muted">Payout progress</span>
        <strong>
          {paidPayoutPercent === null ? "-" : `${formatPercent(paidPayoutPercent)}%`}
        </strong>
        <p>
          {data.summary.paidPayoutCount} of {payoutCount} payouts marked paid.
        </p>
      </article>
      <article className="dashboard-insight-card warning">
        <span className="small-text muted">Open exposure</span>
        <strong>{formatCurrency(data.summary.pendingPayoutAmount)}</strong>
        <p>
          {data.summary.pendingPayoutCount} pending payouts out of{" "}
          {formatCurrency(payoutAmount)} total.
        </p>
      </article>
      <article className="dashboard-insight-card">
        <span className="small-text muted">Month activity</span>
        <strong>{activityCount}</strong>
        <p>
          {data.summary.dealCount} deals, {data.summary.deadDealCount} dead deals
          {largestExpenseDealer
            ? `; top expense: ${largestExpenseDealer.dealerName}`
            : "."}
        </p>
      </article>
    </section>
  );
}
