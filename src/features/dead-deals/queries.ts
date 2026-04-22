import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole, DeadDealRow, FinancierRow } from "@/types/database";
import type {
  DeadDealDetailData,
  DeadDealFilters,
  DeadDealListRecord,
  DeadDealsPageData,
  DeadDealVisibilityScope,
} from "@/features/dead-deals/types";

function mapDeadDealRecord(
  row: Record<string, unknown> & {
    dealers?: { name?: string; code?: number } | null;
    financiers?: { name?: string } | null;
  },
): DeadDealListRecord {
  return {
    ...(row as unknown as DeadDealRow),
    dealer_name: String(row.dealers?.name ?? ""),
    dealer_code:
      typeof row.dealers?.code === "number" ? row.dealers.code : Number(row.dealers?.code ?? 0),
    financier_name: String(row.financiers?.name ?? ""),
  };
}

async function getPartnerShareScopes(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dealer_partner_shares")
    .select("dealer_id, valid_from, valid_to, partners!inner(user_id)")
    .is("deleted_at", null)
    .eq("partners.user_id", profileId);

  if (error) {
    throw new Error(`Failed to load partner visibility scope: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    dealerId: String(row.dealer_id),
    validFrom: String(row.valid_from),
    validTo: row.valid_to ? String(row.valid_to) : null,
  })) satisfies DeadDealVisibilityScope[];
}

function deadDealVisibleToPartner(deadDeal: DeadDealListRecord, scopes: DeadDealVisibilityScope[]) {
  return scopes.some((scope) => {
    if (scope.dealerId !== deadDeal.dealer_id) {
      return false;
    }

    return (
      deadDeal.period_month >= scope.validFrom &&
      (scope.validTo === null || deadDeal.period_month <= scope.validTo)
    );
  });
}

function filterDeadDeals(deadDeals: DeadDealListRecord[], filters: DeadDealFilters) {
  const vin = filters.vin.trim().toLowerCase();

  return deadDeals.filter((deadDeal) => {
    if (filters.periodMonth && deadDeal.period_month !== `${filters.periodMonth}-01`) {
      return false;
    }

    if (filters.dealerId && deadDeal.dealer_id !== filters.dealerId) {
      return false;
    }

    if (filters.financierId && deadDeal.financier_id !== filters.financierId) {
      return false;
    }

    if (vin && !deadDeal.vin_value.toLowerCase().includes(vin)) {
      return false;
    }

    return true;
  });
}

async function getLookupData(params: { profileId: string; role: AppRole }) {
  const supabase = createSupabaseAdminClient();
  const [
    { data: dealersData, error: dealersError },
    { data: financiersData, error: financiersError },
  ] = await Promise.all([
    supabase.from("dealers").select("id, name, code").is("deleted_at", null).order("name"),
    supabase.from("financiers").select("id, name").is("deleted_at", null).order("name"),
  ]);

  if (dealersError || financiersError) {
    throw new Error("Failed to load dead deal lookups.");
  }

  let dealers = (dealersData ?? []) as Array<{ id: string; name: string; code: number }>;

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    const allowedDealerIds = new Set(scopes.map((scope) => scope.dealerId));
    dealers = dealers.filter((dealer) => allowedDealerIds.has(dealer.id));
  }

  return {
    dealers,
    financiers: (financiersData ?? []) as Array<Pick<FinancierRow, "id" | "name">>,
  };
}

export async function getDeadDealsPageData(params: {
  filters: DeadDealFilters;
  profileId: string;
  role: AppRole;
}): Promise<DeadDealsPageData> {
  const supabase = createSupabaseAdminClient();
  const lookups = await getLookupData(params);
  const { data, error } = await supabase
    .from("dead_deals")
    .select("*, dealers!inner(name, code), financiers!inner(name)")
    .is("deleted_at", null)
    .order("dead_deal_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load dead deals: ${error.message}`);
  }

  let deadDeals = ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapDeadDealRecord(
      row as Record<string, unknown> & {
        dealers?: { name?: string; code?: number } | null;
        financiers?: { name?: string } | null;
      },
    ),
  );

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    deadDeals = deadDeals.filter((deadDeal) => deadDealVisibleToPartner(deadDeal, scopes));
  }

  return {
    deadDeals: filterDeadDeals(deadDeals, params.filters),
    filters: params.filters,
    dealers: lookups.dealers,
    financiers: lookups.financiers,
  };
}

export async function getDeadDealDetailData(params: {
  deadDealId: string;
  profileId: string;
  role: AppRole;
}): Promise<DeadDealDetailData> {
  const supabase = createSupabaseAdminClient();
  const lookups = await getLookupData(params);
  const { data, error } = await supabase
    .from("dead_deals")
    .select("*, dealers!inner(name, code), financiers!inner(name)")
    .eq("id", params.deadDealId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error("Dead deal not found.");
  }

  const deadDeal = mapDeadDealRecord(
    data as Record<string, unknown> & {
      dealers?: { name?: string; code?: number } | null;
      financiers?: { name?: string } | null;
    },
  );

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    if (!deadDealVisibleToPartner(deadDeal, scopes)) {
      throw new Error("Dead deal not found.");
    }
  }

  return {
    deadDeal,
    dealers: lookups.dealers,
    financiers: lookups.financiers.map((financier) => ({
      id: financier.id,
      name: financier.name,
    })),
  };
}
