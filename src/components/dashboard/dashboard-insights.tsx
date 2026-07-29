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

function clampPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
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
  const liveActivityPercent = dividePercent(data.summary.dealCount, activityCount);
  const exposurePercent = dividePercent(data.summary.pendingPayoutAmount, payoutAmount);
  const largestExpenseDealer = data.expenseByDealer[0] ?? null;

  return (
    <section className="dashboard-insight-grid">
      <article className="dashboard-insight-card positive">
        <span className="small-text muted">Net margin</span>
        <strong>
          {netMarginPercent === null ? "-" : `${formatPercent(netMarginPercent)}%`}
        </strong>
        <div className="dashboard-progress-track">
          <span
            className="dashboard-progress-bar positive"
            style={{ width: `${clampPercent(netMarginPercent)}%` }}
          />
        </div>
        <p>
          {formatCurrency(data.summary.totalNetProfit)} net from{" "}
          {formatCurrency(data.summary.totalGrossProfit)} gross.
        </p>
      </article>
      <article className="dashboard-insight-card positive">
        <span className="small-text muted">Payout progress</span>
        <strong>
          {paidPayoutPercent === null ? "-" : `${formatPercent(paidPayoutPercent)}%`}
        </strong>
        <div className="dashboard-progress-track">
          <span
            className="dashboard-progress-bar positive"
            style={{ width: `${clampPercent(paidPayoutPercent)}%` }}
          />
        </div>
        <p>
          {data.summary.paidPayoutCount} of {payoutCount} payouts marked paid.
        </p>
      </article>
      <article className="dashboard-insight-card warning">
        <span className="small-text muted">Open exposure</span>
        <strong>{formatCurrency(data.summary.pendingPayoutAmount)}</strong>
        <div className="dashboard-progress-track">
          <span
            className="dashboard-progress-bar warning"
            style={{ width: `${clampPercent(exposurePercent)}%` }}
          />
        </div>
        <p>
          {data.summary.pendingPayoutCount} pending payouts out of{" "}
          {formatCurrency(payoutAmount)} total.
        </p>
      </article>
      <article className="dashboard-insight-card">
        <span className="small-text muted">
          {data.filters.periodMonth ? "Month activity" : "Historical activity"}
        </span>
        <strong>{activityCount}</strong>
        <div className="dashboard-progress-track">
          <span
            className="dashboard-progress-bar info"
            style={{ width: `${clampPercent(liveActivityPercent)}%` }}
          />
        </div>
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
