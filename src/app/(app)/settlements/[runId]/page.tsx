import Link from "next/link";
import { DealerResultsTable } from "@/components/settlements/dealer-results-table";
import { PartnerResultsTable } from "@/components/settlements/partner-results-table";
import { RunSummary } from "@/components/settlements/run-summary";
import { getSettlementRunDetailData } from "@/features/settlements/queries";
import { requireSettlementAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function SettlementRunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const profile = await requireSettlementAccess();
  const { runId } = await params;
  const data = await getSettlementRunDetailData({
    runId,
    profileId: profile.id,
    role: profile.role,
  });

  return (
    <>
      <div className="table-actions" style={{ marginBottom: 24 }}>
        <Link className="ghost-button" href="/settlements">
          Back to settlements
        </Link>
      </div>
      <RunSummary run={data.run} />
      {data.run.error_messages.length > 0 && (
        <section className="panel" style={{ marginBottom: 24 }}>
          <p className="eyebrow">Run errors</p>
          <ul className="inline-issues">
            {data.run.error_messages.map((error, index) => (
              <li key={`${error.dealerId ?? "global"}-${index}`}>
                {error.dealerName ? `${error.dealerName}: ` : ""}
                {error.message}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid two">
        <DealerResultsTable results={data.dealerResults} />
        <PartnerResultsTable
          canEditPayouts={profile.role === "super_admin"}
          results={data.partnerResults}
        />
      </div>
    </>
  );
}
