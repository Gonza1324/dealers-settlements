import Link from "next/link";
import { DealerDetailReport } from "@/components/dashboard/dealer-detail-report";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MonthlyComparisonCard } from "@/components/dashboard/monthly-comparison-card";
import {
  ExpenseByDealerTable,
  NetProfitByDealerTable,
} from "@/components/dashboard/net-profit-by-dealer-table";
import { PayoutSummaryCard } from "@/components/dashboard/payout-summary-card";
import { TopFinanciersTable } from "@/components/dashboard/top-financiers-table";
import type { DashboardPageData } from "@/features/dashboard/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function AdminDashboardSection({
  data,
}: {
  data: DashboardPageData;
}) {
  return (
    <>
      <section className="grid four" style={{ marginBottom: 24 }}>
        <MetricCard
          eyebrow="Net profit"
          helper="Total monthly net profit across visible dealers."
          value={formatCurrency(data.summary.totalNetProfit)}
        />
        <MetricCard
          eyebrow="Partners to pay"
          helper={`${data.summary.pendingPayoutCount} pending payouts this month.`}
          value={formatCurrency(data.summary.pendingPayoutAmount)}
        />
        <MetricCard
          eyebrow="Expenses"
          helper="Allocated monthly expense total."
          value={formatCurrency(data.summary.totalExpense)}
        />
        <MetricCard
          eyebrow="Paid"
          helper={`${data.summary.paidPayoutCount} payouts marked as paid.`}
          value={formatCurrency(data.summary.paidPayoutAmount)}
        />
      </section>

      <section className="panel dashboard-quick-actions">
        <div>
          <p className="eyebrow">Quick action</p>
          <h2 style={{ marginTop: 0 }}>Current month settlement</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            Jump straight into the settlement run and payout controls for the selected month.
          </p>
        </div>
        <Link className="action-button" href={data.quickSettlementHref}>
          Open settlements
        </Link>
      </section>

      <section className="grid two" style={{ marginTop: 24, marginBottom: 24 }}>
        <NetProfitByDealerTable
          rows={data.dealerPerformance}
          title="Net profit by dealer"
        />
        <MonthlyComparisonCard points={data.comparison} />
      </section>

      <section className="grid two" style={{ marginBottom: 24 }}>
        <NetProfitByDealerTable
          rows={data.bestDealers}
          title="Best dealers this month"
        />
        <NetProfitByDealerTable
          rows={data.worstDealers}
          title="Worst dealers this month"
        />
      </section>

      <section className="grid two" style={{ marginBottom: 24 }}>
        <ExpenseByDealerTable rows={data.expenseByDealer} />
        <TopFinanciersTable rows={data.topFinanciers} />
      </section>

      <PayoutSummaryCard rows={data.payoutRows} title="Partner payouts by month" />

      <div style={{ marginTop: 24 }}>
        <DealerDetailReport report={data.dealerDetail} role="super_admin" />
      </div>
    </>
  );
}
