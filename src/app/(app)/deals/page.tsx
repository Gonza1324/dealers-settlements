import { DealCreateForm } from "@/components/deals/deal-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { DealsFilters } from "@/components/deals/deals-filters";
import { DealsTable } from "@/components/deals/deals-table";
import { dealFiltersSchema } from "@/features/deals/schema";
import { getDealsPageData } from "@/features/deals/queries";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole(["super_admin", "partner_viewer"]);
  const rawSearchParams = await searchParams;
  const filters = dealFiltersSchema.parse({
    periodMonth:
      typeof rawSearchParams.periodMonth === "string"
        ? rawSearchParams.periodMonth
        : "",
    dealerId:
      typeof rawSearchParams.dealerId === "string" ? rawSearchParams.dealerId : "",
    financierId:
      typeof rawSearchParams.financierId === "string"
        ? rawSearchParams.financierId
        : "",
    vin: typeof rawSearchParams.vin === "string" ? rawSearchParams.vin : "",
    make: typeof rawSearchParams.make === "string" ? rawSearchParams.make : "",
    model: typeof rawSearchParams.model === "string" ? rawSearchParams.model : "",
    isManuallyEdited:
      typeof rawSearchParams.isManuallyEdited === "string"
        ? rawSearchParams.isManuallyEdited
        : "all",
    page: typeof rawSearchParams.page === "string" ? rawSearchParams.page : "1",
  });

  const data = await getDealsPageData({
    filters,
    profileId: profile.id,
    role: profile.role,
  });
  const canCreate = profile.role === "super_admin";

  return (
    <>
      <PageHeader
        eyebrow="Deals"
        title="Consolidated deals"
        description="Review the deals created from approved staging rows, filter by operational dimensions and inspect which records were edited manually."
      />
      {canCreate && (
        <DealCreateForm
          canCreate={canCreate}
          dealers={data.dealers.map((dealer) => ({
            id: dealer.dealer_id,
            name: dealer.dealer_name,
            code: dealer.dealer_code,
          }))}
          financiers={data.financiers}
        />
      )}
      <DealsFilters
        dealers={data.dealers}
        financiers={data.financiers}
        filters={data.filters}
      />
      <DealsTable
        deals={data.deals}
        filters={data.filters}
        totalCount={data.totalCount}
        totalPages={data.totalPages}
      />
    </>
  );
}
