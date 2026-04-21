import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole, DealRow, FinancierRow, ProfileRow } from "@/types/database";
import type {
  DealDetailData,
  DealFilters,
  DealHistoryRecord,
  DealListRecord,
  DealsPageData,
  PartnerShareScope,
} from "@/features/deals/types";

const PAGE_SIZE = 20;

function normalizeTextFilter(value: string) {
  return value.trim();
}

function isDealVisibleToPartner(deal: DealRow, shares: PartnerShareScope[]) {
  return shares.some((share) => {
    if (share.dealerId !== deal.dealer_id) {
      return false;
    }

    const period = deal.period_month;
    return period >= share.validFrom && (share.validTo === null || period <= share.validTo);
  });
}

function mapDealRecord(
  row: Record<string, unknown> & {
    dealers?: { name?: string; code?: number } | null;
    financiers?: { name?: string } | Array<{ name?: string }> | null;
  },
): DealListRecord {
  const financierName = Array.isArray(row.financiers)
    ? row.financiers[0]?.name
    : row.financiers?.name;

  return {
    ...(row as unknown as DealRow),
    dealer_name: String(row.dealers?.name ?? ""),
    dealer_code:
      typeof row.dealers?.code === "number" ? row.dealers.code : Number(row.dealers?.code ?? 0),
    financier_name: typeof financierName === "string" ? financierName : null,
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
  }));
}

async function getFilterOptions(role: AppRole, profileId: string) {
  const supabase = createSupabaseAdminClient();
  const [{ data: dealersData, error: dealersError }, { data: financiersData, error: financiersError }] =
    await Promise.all([
      supabase.from("dealers").select("id, name, code").is("deleted_at", null).order("name"),
      supabase.from("financiers").select("id, name").is("deleted_at", null).order("name"),
    ]);

  if (dealersError || financiersError) {
    throw new Error("Failed to load deal filter options.");
  }

  let dealers = (dealersData ?? []) as Array<{ id: string; name: string; code: number }>;

  if (role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(profileId);
    const allowedDealerIds = new Set(scopes.map((scope) => scope.dealerId));
    dealers = dealers.filter((dealer) => allowedDealerIds.has(dealer.id));
  }

  return {
    dealers,
    financiers: (financiersData ?? []) as Array<Pick<FinancierRow, "id" | "name">>,
  };
}

type FilterOperations = {
  ilike: (column: string, pattern: string) => FilterOperations;
  eq: (column: string, value: string | boolean) => FilterOperations;
};

function applyDbFilters<T>(
  query: T,
  filters: DealFilters,
) {
  let nextQuery = query as unknown as FilterOperations;

  if (filters.periodMonth) {
    nextQuery = nextQuery.eq("period_month", filters.periodMonth);
  }

  if (filters.dealerId) {
    nextQuery = nextQuery.eq("dealer_id", filters.dealerId);
  }

  if (filters.financierId) {
    nextQuery = nextQuery.eq("financier_id", filters.financierId);
  }

  if (filters.vin) {
    nextQuery = nextQuery.ilike("vin_value", `%${normalizeTextFilter(filters.vin)}%`);
  }

  if (filters.make) {
    nextQuery = nextQuery.ilike("make_value", `%${normalizeTextFilter(filters.make)}%`);
  }

  if (filters.model) {
    nextQuery = nextQuery.ilike("model_value", `%${normalizeTextFilter(filters.model)}%`);
  }

  if (filters.isManuallyEdited === "yes") {
    nextQuery = nextQuery.eq("is_manually_edited", true);
  }

  if (filters.isManuallyEdited === "no") {
    nextQuery = nextQuery.eq("is_manually_edited", false);
  }

  return nextQuery as T;
}

export async function getDealsPageData(params: {
  filters: DealFilters;
  profileId: string;
  role: AppRole;
}): Promise<DealsPageData> {
  const supabase = createSupabaseAdminClient();
  const filterOptions = await getFilterOptions(params.role, params.profileId);

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    const { data, error } = await applyDbFilters(
      supabase
        .from("deals")
        .select("*, dealers!inner(name, code), financiers(name)")
        .is("deleted_at", null)
        .order("period_month", { ascending: false })
        .order("created_at", { ascending: false }),
      params.filters,
    );

    if (error) {
      throw new Error(`Failed to load deals: ${error.message}`);
    }

    const visibleDeals = ((data ?? []) as Array<Record<string, unknown>>)
      .map((row) => mapDealRecord(row as Record<string, unknown> & { dealers?: { name?: string; code?: number } | null; financiers?: { name?: string } | null }))
      .filter((deal) => isDealVisibleToPartner(deal, scopes));

    const totalCount = visibleDeals.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const page = Math.min(params.filters.page, totalPages);
    const deals = visibleDeals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return {
      deals,
      dealers: filterOptions.dealers.map((dealer) => ({
        dealer_id: dealer.id,
        dealer_name: dealer.name,
        dealer_code: dealer.code,
      })),
      financiers: filterOptions.financiers,
      filters: { ...params.filters, page },
      totalCount,
      totalPages,
      pageSize: PAGE_SIZE,
    };
  }

  const from = (params.filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await applyDbFilters(
    supabase
      .from("deals")
      .select("*, dealers!inner(name, code), financiers(name)", { count: "exact" })
      .is("deleted_at", null)
      .order("period_month", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to),
    params.filters,
  );

  if (error) {
    throw new Error(`Failed to load deals: ${error.message}`);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    deals: ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
      mapDealRecord(row as Record<string, unknown> & { dealers?: { name?: string; code?: number } | null; financiers?: { name?: string } | null }),
    ),
    dealers: filterOptions.dealers.map((dealer) => ({
      dealer_id: dealer.id,
      dealer_name: dealer.name,
      dealer_code: dealer.code,
    })),
    financiers: filterOptions.financiers,
    filters: params.filters,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}

export async function getDealDetailData(params: {
  dealId: string;
  profileId: string;
  role: AppRole;
}): Promise<DealDetailData> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*, dealers!inner(name, code), financiers(name)")
    .eq("id", params.dealId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error("Deal not found.");
  }

  const deal = mapDealRecord(
    data as Record<string, unknown> & {
      dealers?: { name?: string; code?: number } | null;
      financiers?: { name?: string } | null;
    },
  );

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    if (!isDealVisibleToPartner(deal, scopes)) {
      throw new Error("Deal not found.");
    }
  }

  const [{ data: historyData, error: historyError }, filterOptions] = await Promise.all([
    supabase
      .from("deal_edit_history")
      .select("*")
      .eq("deal_id", params.dealId)
      .order("changed_at", { ascending: false }),
    getFilterOptions(params.role, params.profileId),
  ]);

  if (historyError) {
    throw new Error(`Failed to load deal history: ${historyError.message}`);
  }

  const profileIds = [...new Set(((historyData ?? []) as Array<{ changed_by: string | null }>).map((row) => row.changed_by).filter(Boolean))] as string[];
  let profileMap = new Map<string, Pick<ProfileRow, "full_name" | "email">>();

  if (profileIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", profileIds);

    if (profilesError) {
      throw new Error(`Failed to load editor profiles: ${profilesError.message}`);
    }

    profileMap = new Map(
      ((profilesData ?? []) as Array<ProfileRow>).map((profile) => [
        profile.id,
        { full_name: profile.full_name, email: profile.email },
      ]),
    );
  }

  const history: DealHistoryRecord[] = ((historyData ?? []) as Array<Record<string, unknown>>).map(
    (row) => {
      const changedBy = typeof row.changed_by === "string" ? profileMap.get(row.changed_by) : null;
      return {
        ...(row as unknown as DealHistoryRecord),
        changed_by_name: changedBy?.full_name ?? null,
        changed_by_email: changedBy?.email ?? null,
      };
    },
  );

  return {
    deal,
    history,
    dealers: filterOptions.dealers,
    financiers: filterOptions.financiers.map((financier) => ({
      id: financier.id,
      name: financier.name,
    })),
  };
}
