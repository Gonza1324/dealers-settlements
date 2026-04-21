import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { PayoutForm } from "@/components/settlements/payout-form";
import type { PartnerMonthlyResultRecord } from "@/features/settlements/types";

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

  return (
    <section className="panel">
      <p className="eyebrow">Partner view</p>
      <h2 style={{ marginTop: 0 }}>Partner monthly results</h2>
      <DataTable
        columns={[
          { key: "dealer", label: "Dealer" },
          { key: "partner", label: "Partner" },
          { key: "share", label: "Share %" },
          { key: "amount", label: "Partner amount" },
          { key: "status", label: "Payment status" },
          { key: "payment", label: "Payment management" },
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
            <td>{result.partner_amount}</td>
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
              <PayoutForm canEdit={canEditPayouts} result={result} />
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
