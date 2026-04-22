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
      <section className="grid four" style={{ marginBottom: 24 }}>
        <MetricCard
          eyebrow="Your dealers"
          helper="Dealers where you currently participate."
          value={String(data.summary.visibleDealerCount)}
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

      <section className="panel dashboard-quick-actions">
        <div>
          <p className="eyebrow">Read only</p>
          <h2 style={{ marginTop: 0 }}>
            {data.partnerName ? `${data.partnerName} overview` : "Partner overview"}
          </h2>
          <p className="muted" style={{ marginBottom: 0 }}>
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
      </section>

      <section className="grid two" style={{ marginTop: 24, marginBottom: 24 }}>
        <NetProfitByDealerTable
          rows={data.dealerPerformance}
          title="Net profit by dealer"
        />
        <MonthlyComparisonCard points={data.comparison} />
      </section>

      <section className="grid two" style={{ marginBottom: 24 }}>
        <ExpenseByDealerTable rows={data.expenseByDealer} />
        <PayoutSummaryCard rows={data.payoutRows} title="Your payouts by month" />
      </section>

      <div style={{ marginBottom: 24 }}>
        <DealerDetailReport report={data.dealerDetail} role="partner_viewer" />
      </div>
    </>
  );
}
