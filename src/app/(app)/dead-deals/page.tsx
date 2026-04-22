import { DeadDealForm } from "@/components/dead-deals/dead-deal-form";
import { DeadDealsFilters } from "@/components/dead-deals/dead-deals-filters";
import { DeadDealsTable } from "@/components/dead-deals/dead-deals-table";
import { PageHeader } from "@/components/ui/page-header";
import { deadDealFiltersSchema } from "@/features/dead-deals/schema";
import { getDeadDealsPageData } from "@/features/dead-deals/queries";
import { requireDeadDealAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DeadDealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireDeadDealAccess();
  const rawSearchParams = await searchParams;
  const filters = deadDealFiltersSchema.parse({
    periodMonth:
      typeof rawSearchParams.periodMonth === "string" ? rawSearchParams.periodMonth : "",
    dealerId: typeof rawSearchParams.dealerId === "string" ? rawSearchParams.dealerId : "",
    financierId:
      typeof rawSearchParams.financierId === "string" ? rawSearchParams.financierId : "",
    vin: typeof rawSearchParams.vin === "string" ? rawSearchParams.vin : "",
  });

  const data = await getDeadDealsPageData({
    filters,
    profileId: profile.id,
    role: profile.role,
  });

  const canManage = profile.role === "super_admin" || profile.role === "expense_admin";

  return (
    <>
      <PageHeader
        eyebrow="Dead deals"
        title="Dead deals"
        description="Register dead deals manually, keep dealer profit at net gross minus a fixed 20% financier commission, and include that profit in monthly settlements."
      />
      <DeadDealsFilters
        dealers={data.dealers}
        financiers={data.financiers}
        filters={data.filters}
      />
      <DeadDealsTable deadDeals={data.deadDeals} />
      {canManage && (
        <div style={{ marginTop: 24 }}>
          <DeadDealForm canEdit dealers={data.dealers} financiers={data.financiers} />
        </div>
      )}
    </>
  );
}
