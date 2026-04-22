import { DealerResultsTable } from "@/components/settlements/dealer-results-table";
import { PartnerResultsTable } from "@/components/settlements/partner-results-table";
import { RunSummary } from "@/components/settlements/run-summary";
import { SettlementsControls } from "@/components/settlements/settlements-controls";
import { SettlementsRunsTable } from "@/components/settlements/settlements-runs-table";
import { settlementFiltersSchema } from "@/features/settlements/schema";
import { getSettlementsPageData } from "@/features/settlements/queries";
import { requireSettlementAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireSettlementAccess();
  const rawSearchParams = await searchParams;
  const filters = settlementFiltersSchema.parse({
    periodMonth:
      typeof rawSearchParams.periodMonth === "string"
        ? rawSearchParams.periodMonth
        : "",
  });

  const data = await getSettlementsPageData({
    filters,
    profileId: profile.id,
    role: profile.role,
  });

  const canRun = profile.role === "super_admin";

  return (
    <>
      {canRun && <SettlementsControls canRun periodMonth={filters.periodMonth} />}
      {data.currentRun && <RunSummary run={data.currentRun} />}
      <SettlementsRunsTable runs={data.runs} />
      {data.currentRun && (
        <div className="grid two" style={{ marginTop: 24 }}>
          <DealerResultsTable results={data.currentDealerResults} />
          <PartnerResultsTable
            canEditPayouts={canRun}
            results={data.currentPartnerResults}
          />
        </div>
      )}
    </>
  );
}
