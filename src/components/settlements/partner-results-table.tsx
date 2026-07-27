import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { PayoutForm } from "@/components/settlements/payout-form";
import type { PartnerMonthlyResultRecord } from "@/features/settlements/types";
import { formatCurrency } from "@/lib/utils/format";

function formatPeriodLabel(results: PartnerMonthlyResultRecord[]) {
  const periods = [...new Set(results.map((result) => result.period_month.slice(0, 7)))]
    .sort()
    .reverse();

  if (periods.length === 1) {
    return periods[0];
  }

  return periods.join(", ");
}

export function PartnerResultsTable({
  canEditPayouts,
  results,
}: {
  canEditPayouts: boolean;
  results: PartnerMonthlyResultRecord[];
}) {
  if (results.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="No partner results"
          description="No partner settlement rows are visible for this run and access scope."
        />
      </section>
    );
  }

  const periodLabel = formatPeriodLabel(results);
  const totalAmount = results.reduce(
    (sum, result) => sum + Number(result.partner_amount),
    0,
  );
  const pendingAmount = results
    .filter((result) => result.payout_status === "pending")
    .reduce((sum, result) => sum + Number(result.partner_amount), 0);
  const paidAmount = results
    .filter((result) => result.payout_status === "paid")
    .reduce((sum, result) => sum + Number(result.paid_amount ?? result.partner_amount), 0);

  return (
    <section className="panel">
      <p className="eyebrow">Partner view</p>
      <div className="settlement-results-header">
        <div>
          <h2 style={{ marginTop: 0 }}>Partner monthly results</h2>
          <p className="muted" style={{ margin: 0 }}>
            Totals shown for period {periodLabel} in this settlement run.
          </p>
        </div>
        <div className="settlement-results-totals">
          <article>
            <span>Total</span>
            <strong>{formatCurrency(totalAmount)}</strong>
          </article>
          <article>
            <span>Pending</span>
            <strong>{formatCurrency(pendingAmount)}</strong>
          </article>
          <article>
            <span>Paid</span>
            <strong>{formatCurrency(paidAmount)}</strong>
          </article>
        </div>
      </div>
      <DataTable
        className="partner-results-table"
        wrapperClassName="registry-table-scroll"
        columns={[
          { key: "dealer", label: "Dealer" },
          { key: "partner", label: "Partner" },
          { key: "share", label: "Share %" },
          { key: "amount", label: "Partner amount" },
          { key: "status", label: "Payment status" },
          { key: "payment", label: "Manage" },
        ]}
      >
        {results.map((result) => (
          <tr key={result.id}>
            <td>
              {result.dealer_name}
              <div className="small-text muted">Code {result.dealer_code}</div>
            </td>
            <td>
              {result.partner_name}
              <div className="small-text muted">{result.partner_user_email ?? ""}</div>
            </td>
            <td>{result.share_percentage_snapshot}</td>
            <td>{formatCurrency(result.partner_amount)}</td>
            <td>
              <StatusPill tone={result.payout_status === "paid" ? "success" : "warning"}>
                {result.payout_status}
              </StatusPill>
              {result.payment_attachment_url && (
                <div style={{ marginTop: 8 }}>
                  <Link
                    className="ghost-button"
                    href={result.payment_attachment_url}
                    target="_blank"
                  >
                    Attachment
                  </Link>
                </div>
              )}
            </td>
            <td>
              <details className="payout-details">
                <summary className="payout-summary">
                  {canEditPayouts ? "Manage payment" : "View payment"}
                </summary>
                <PayoutForm canEdit={canEditPayouts} result={result} />
              </details>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
