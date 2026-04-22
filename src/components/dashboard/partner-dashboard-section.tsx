import Link from "next/link";
import { DealerDetailReport } from "@/components/dashboard/dealer-detail-report";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MonthlyComparisonCard } from "@/components/dashboard/monthly-comparison-card";
import {
  ExpenseByDealerTable,
  NetProfitByDealerTable,
} from "@/components/dashboard/net-profit-by-dealer-table";
import { PayoutSummaryCard } from "@/components/dashboard/payout-summary-card";
import type { DashboardPageData } from "@/features/dashboard/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function PartnerDashboardSection({
  data,
}: {
  data: DashboardPageData;
}) {
  return (
    <>
      <section className="dashboard-kpi-strip grid four">
        <MetricCard
          eyebrow="Your dealers"
          helper="Dealers where you currently participate."
          value={String(data.summary.visibleDealerCount)}
          featured
        />
        <MetricCard
          eyebrow="Visible net"
          helper="Net profit across your visible dealers for this month."
          value={formatCurrency(data.summary.totalNetProfit)}
        />
        <MetricCard
          eyebrow="Visible expenses"
          helper="Allocated expenses affecting your dealers."
          value={formatCurrency(data.summary.totalExpense)}
        />
        <MetricCard
          eyebrow="Pending payouts"
          helper={`${data.summary.pendingPayoutCount} pending payments for your scope.`}
          value={formatCurrency(data.summary.pendingPayoutAmount)}
        />
      </section>

      <section className="dashboard-primary-row">
        <section className="panel dashboard-highlight-card">
          <div className="dashboard-card-header">
            <div>
              <p className="eyebrow">Read only</p>
              <h2 className="dashboard-section-title">
                {data.partnerName ? `${data.partnerName} overview` : "Partner overview"}
              </h2>
              <p className="dashboard-section-copy">
                Review dealer performance, related deals, allocated expenses and payout status.
              </p>
            </div>
            <div className="table-actions">
              <Link className="ghost-button" href="/deals">
                Open deals
              </Link>
              <Link className="ghost-button" href="/expenses">
                Open expenses
              </Link>
              <Link className="ghost-button" href="/settlements">
                Open settlements
              </Link>
            </div>
          </div>
          <div className="dashboard-highlight-stats">
            <article className="dashboard-highlight-stat">
              <span className="small-text muted">Visible dealers</span>
              <strong>{data.summary.visibleDealerCount}</strong>
            </article>
            <article className="dashboard-highlight-stat">
              <span className="small-text muted">Pending payouts</span>
              <strong>{data.summary.pendingPayoutCount}</strong>
            </article>
            <article className="dashboard-highlight-stat">
              <span className="small-text muted">Months compared</span>
              <strong>{data.comparison.length}</strong>
            </article>
          </div>
        </section>

        <MonthlyComparisonCard points={data.comparison} />
      </section>

      <section className="grid two" style={{ marginBottom: 24 }}>
        <NetProfitByDealerTable
          rows={data.dealerPerformance}
          title="Net profit by dealer"
        />
        <PayoutSummaryCard rows={data.payoutRows} title="Your payouts by month" />
      </section>

      <section className="grid two" style={{ marginBottom: 24 }}>
        <ExpenseByDealerTable rows={data.expenseByDealer} />
        <NetProfitByDealerTable
          rows={data.dealerPerformance.slice(0, 5)}
          title="Most relevant dealers"
        />
      </section>

      <div style={{ marginBottom: 24 }}>
        <DealerDetailReport report={data.dealerDetail} role="partner_viewer" />
      </div>
    </>
  );
}
