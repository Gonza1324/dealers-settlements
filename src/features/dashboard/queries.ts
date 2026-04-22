import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/database";
import type {
  DashboardFilters,
  DashboardOption,
  DashboardPageData,
  DashboardPayoutRecord,
  DealerDetailDealRecord,
  DealerDetailExpenseRecord,
  DealerDetailPartnerRecord,
  DealerDetailReport,
  DealerPerformanceRecord,
  ExpenseByDealerRecord,
  MonthlyComparisonPoint,
  PartnerDealerSnapshot,
  TopFinancierRecord,
} from "@/features/dashboard/types";

type PartnerScope = {
  dealerId: string;
  partnerId: string;
  validFrom: string;
  validTo: string | null;
};

type DealerLookup = {
  id: string;
  name: string;
  code: number;
};

type FinancierLookup = {
  id: string;
  name: string;
};

function toMonthStart(periodMonth: string) {
  return `${periodMonth}-01`;
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function dealerVisibleForMonth(
  dealerId: string,
  periodMonth: string,
  scopes: PartnerScope[],
) {
  return scopes.some(
    (scope) =>
      scope.dealerId === dealerId &&
      periodMonth >= scope.validFrom &&
      (scope.validTo === null || periodMonth <= scope.validTo),
  );
}

async function getPartnerScopes(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dealer_partner_shares")
    .select("dealer_id, partner_id, valid_from, valid_to, partners!inner(user_id)")
    .is("deleted_at", null)
    .eq("partners.user_id", profileId);

  if (error) {
    throw new Error(`Failed to load dashboard visibility scope: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    dealerId: String(row.dealer_id),
    partnerId: String(row.partner_id),
    validFrom: String(row.valid_from),
    validTo: row.valid_to ? String(row.valid_to) : null,
  })) satisfies PartnerScope[];
}

async function getLookups(params: {
  role: AppRole;
  profileId: string;
  scopes: PartnerScope[];
}) {
  const supabase = createSupabaseAdminClient();
  const [{ data: dealersData, error: dealersError }, { data: financiersData, error: financiersError }] =
    await Promise.all([
      supabase.from("dealers").select("id, name, code").is("deleted_at", null).order("name"),
      supabase.from("financiers").select("id, name").is("deleted_at", null).order("name"),
    ]);

  if (dealersError || financiersError) {
    throw new Error("Failed to load dashboard filters.");
  }

  let dealers = ((dealersData ?? []) as Array<Record<string, unknown>>).map((dealer) => ({
    id: String(dealer.id),
    name: String(dealer.name ?? ""),
    code: toNumber(dealer.code),
  })) satisfies DealerLookup[];

  if (params.role === "partner_viewer") {
    const allowed = new Set(params.scopes.map((scope) => scope.dealerId));
    dealers = dealers.filter((dealer) => allowed.has(dealer.id));
  }

  const financiers = ((financiersData ?? []) as Array<Record<string, unknown>>).map(
    (financier) =>
      ({
        id: String(financier.id),
        name: String(financier.name ?? ""),
      }) satisfies FinancierLookup,
  );

  return { dealers, financiers };
}

function summarizeDealerResults(
  rows: DealerPerformanceRecord[],
) {
  return {
    totalGrossProfit: rows.reduce((sum, row) => sum + row.grossProfitTotal, 0),
    totalExpense: rows.reduce((sum, row) => sum + row.expenseTotal, 0),
    totalNetProfit: rows.reduce((sum, row) => sum + row.netProfitTotal, 0),
  };
}

function buildPayoutMap(
  payouts: Array<Record<string, unknown>>,
) {
  return new Map(
    payouts.map((row) => [
      `${String(row.dealer_id)}::${String(row.partner_id)}::${String(row.period_month)}`,
      row,
    ]),
  );
}

export async function getDashboardPageData(params: {
  filters: DashboardFilters;
  role: AppRole;
  profileId: string;
}): Promise<DashboardPageData> {
  const supabase = createSupabaseAdminClient();
  const periodMonthDate = toMonthStart(params.filters.periodMonth);
  const scopes =
    params.role === "partner_viewer"
      ? await getPartnerScopes(params.profileId)
      : [];
  const { dealers, financiers } = await getLookups({
    role: params.role,
    profileId: params.profileId,
    scopes,
  });

  const visibleDealerIds =
    params.role === "partner_viewer"
      ? new Set(
          scopes
            .filter((scope) =>
              dealerVisibleForMonth(scope.dealerId, periodMonthDate, scopes),
            )
            .map((scope) => scope.dealerId),
        )
      : null;
  const visiblePartnerIds =
    params.role === "partner_viewer"
      ? new Set(scopes.map((scope) => scope.partnerId))
      : null;

  const [
    dealerResultResponse,
    partnerResultResponse,
    payoutResponse,
    expenseResponse,
    dealResponse,
    deadDealResponse,
    comparisonResponse,
    partnerRecordResponse,
  ] = await Promise.all([
    supabase
      .from("dealer_monthly_results")
      .select("*, dealers!inner(name, code), monthly_calculation_runs!inner(is_current)")
      .eq("monthly_calculation_runs.is_current", true)
      .eq("period_month", periodMonthDate),
    supabase
      .from("partner_monthly_results")
      .select(
        "*, dealers!inner(name, code), partners!inner(display_name, user_id), monthly_calculation_runs!inner(is_current)",
      )
      .eq("monthly_calculation_runs.is_current", true)
      .eq("period_month", periodMonthDate),
    supabase
      .from("partner_monthly_payouts")
      .select("*")
      .eq("period_month", periodMonthDate),
    supabase
      .from("expenses")
      .select(
        "id, period_month, expense_date, description, expense_allocations!inner(allocated_amount, dealer_id, dealers!inner(name, code)), expense_categories(name)",
      )
      .eq("period_month", periodMonthDate)
      .is("deleted_at", null),
    supabase
      .from("deals")
      .select("id, dealer_id, financier_id, vin_value, sale_value, deal_profit, financiers(name)")
      .eq("period_month", periodMonthDate)
      .is("deleted_at", null),
    supabase
      .from("dead_deals")
      .select(
        "id, dealer_id, financier_id, vin_value, dead_deal_date, dealer_profit, financiers(name)",
      )
      .eq("period_month", periodMonthDate)
      .is("deleted_at", null),
    supabase
      .from("dealer_monthly_results")
      .select("period_month, dealer_id, gross_profit_total, expense_total, net_profit_total, monthly_calculation_runs!inner(is_current)")
      .eq("monthly_calculation_runs.is_current", true)
      .order("period_month", { ascending: false })
      .limit(120),
    params.role === "partner_viewer"
      ? supabase
          .from("partners")
          .select("id, display_name")
          .eq("user_id", params.profileId)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (
    dealerResultResponse.error ||
    partnerResultResponse.error ||
    payoutResponse.error ||
    expenseResponse.error ||
    dealResponse.error ||
    deadDealResponse.error ||
    comparisonResponse.error ||
    partnerRecordResponse.error
  ) {
    throw new Error("Failed to load dashboard data.");
  }

  let dealerPerformance = ((dealerResultResponse.data ?? []) as Array<Record<string, unknown>>)
    .map((row) => ({
      dealerId: String(row.dealer_id),
      dealerName: String((row.dealers as { name?: string } | null)?.name ?? ""),
      dealerCode: toNumber((row.dealers as { code?: unknown } | null)?.code),
      grossProfitTotal: toNumber(row.gross_profit_total),
      expenseTotal: toNumber(row.expense_total),
      netProfitTotal: toNumber(row.net_profit_total),
    })) satisfies DealerPerformanceRecord[];

  let partnerResults = ((partnerResultResponse.data ?? []) as Array<Record<string, unknown>>)
    .map((row) => ({
      resultId: String(row.id),
      dealerId: String(row.dealer_id),
      dealerName: String((row.dealers as { name?: string } | null)?.name ?? ""),
      dealerCode: toNumber((row.dealers as { code?: unknown } | null)?.code),
      partnerId: String(row.partner_id),
      partnerName: String((row.partners as { display_name?: string } | null)?.display_name ?? ""),
      partnerUserId:
        typeof (row.partners as { user_id?: string } | null)?.user_id === "string"
          ? ((row.partners as { user_id?: string }).user_id ?? null)
          : null,
      periodMonth: String(row.period_month),
      sharePercentage: toNumber(row.share_percentage_snapshot),
      partnerAmount: toNumber(row.partner_amount),
    }));

  let payouts = (payoutResponse.data ?? []) as Array<Record<string, unknown>>;

  if (visibleDealerIds) {
    dealerPerformance = dealerPerformance.filter((row) =>
      visibleDealerIds.has(row.dealerId),
    );
    partnerResults = partnerResults.filter(
      (row) =>
        visibleDealerIds.has(row.dealerId) &&
        visiblePartnerIds?.has(row.partnerId),
    );
    payouts = payouts.filter(
      (row) =>
        visibleDealerIds.has(String(row.dealer_id)) &&
        visiblePartnerIds?.has(String(row.partner_id)),
    );
  }

  if (params.filters.dealerId) {
    dealerPerformance = dealerPerformance.filter(
      (row) => row.dealerId === params.filters.dealerId,
    );
    partnerResults = partnerResults.filter(
      (row) => row.dealerId === params.filters.dealerId,
    );
    payouts = payouts.filter(
      (row) => String(row.dealer_id) === params.filters.dealerId,
    );
  }

  const payoutMap = buildPayoutMap(payouts);

  let payoutRows = partnerResults.map((row) => {
    const payout = payoutMap.get(`${row.dealerId}::${row.partnerId}::${row.periodMonth}`);
    const paymentStatus =
      payout?.payment_status === "paid" ? "paid" : "pending";

    return {
      payoutId: payout?.id ? String(payout.id) : null,
      dealerId: row.dealerId,
      dealerName: row.dealerName,
      dealerCode: row.dealerCode,
      partnerId: row.partnerId,
      partnerName: row.partnerName,
      periodMonth: row.periodMonth,
      partnerAmount: row.partnerAmount,
      paymentStatus,
      paidAmount:
        payout && payout.paid_amount !== null ? toNumber(payout.paid_amount) : null,
      paidAt: payout?.paid_at ? String(payout.paid_at).slice(0, 10) : null,
    };
  }) satisfies DashboardPayoutRecord[];

  if (params.filters.paymentStatus) {
    payoutRows = payoutRows.filter(
      (row) => row.paymentStatus === params.filters.paymentStatus,
    );
  }

  const expenseRows = ((expenseResponse.data ?? []) as Array<Record<string, unknown>>)
    .flatMap((expense) => {
      const allocations = Array.isArray(expense.expense_allocations)
        ? expense.expense_allocations
        : [];

      return allocations.map((allocation) => {
        const dealersRow = (allocation as Record<string, unknown>).dealers as
          | { name?: string; code?: unknown }
          | null;

        return {
          expenseId: String(expense.id),
          dealerId: String((allocation as Record<string, unknown>).dealer_id),
          dealerName: String(dealersRow?.name ?? ""),
          dealerCode: toNumber(dealersRow?.code),
          expenseDate: String(expense.expense_date),
          description: String(expense.description ?? ""),
          categoryName:
            typeof (expense.expense_categories as { name?: string } | null)?.name ===
            "string"
              ? ((expense.expense_categories as { name?: string }).name ?? null)
              : null,
          allocatedAmount: toNumber(
            (allocation as Record<string, unknown>).allocated_amount,
          ),
        };
      });
    });

  const deals = ((dealResponse.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    dealerId: String(row.dealer_id),
    financierId: row.financier_id ? String(row.financier_id) : null,
    financierName:
      typeof (row.financiers as { name?: string } | null)?.name === "string"
        ? ((row.financiers as { name?: string }).name ?? null)
        : null,
    vinValue: String(row.vin_value ?? ""),
    date: String(row.sale_value),
    dealerProfit: toNumber(row.deal_profit),
  }));

  const deadDeals = ((deadDealResponse.data ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: String(row.id),
      dealerId: String(row.dealer_id),
      financierId: row.financier_id ? String(row.financier_id) : null,
      financierName:
        typeof (row.financiers as { name?: string } | null)?.name === "string"
          ? ((row.financiers as { name?: string }).name ?? null)
          : null,
      vinValue: String(row.vin_value ?? ""),
      date: String(row.dead_deal_date),
      dealerProfit: toNumber(row.dealer_profit),
    }),
  );

  const visibleByDealer = (dealerId: string) =>
    !visibleDealerIds || visibleDealerIds.has(dealerId);

  const dealerFilter = (dealerId: string) =>
    !params.filters.dealerId || dealerId === params.filters.dealerId;

  const financierFilter = (financierId: string | null) =>
    !params.filters.financierId || financierId === params.filters.financierId;

  const filteredExpenseRows = expenseRows.filter(
    (row) => visibleByDealer(row.dealerId) && dealerFilter(row.dealerId),
  );
  const filteredDeals = deals.filter(
    (row) =>
      visibleByDealer(row.dealerId) &&
      dealerFilter(row.dealerId) &&
      financierFilter(row.financierId),
  );
  const filteredDeadDeals = deadDeals.filter(
    (row) =>
      visibleByDealer(row.dealerId) &&
      dealerFilter(row.dealerId) &&
      financierFilter(row.financierId),
  );

  const expenseByDealerMap = new Map<string, ExpenseByDealerRecord>();

  filteredExpenseRows.forEach((row) => {
    const current = expenseByDealerMap.get(row.dealerId) ?? {
      dealerId: row.dealerId,
      dealerName: row.dealerName,
      dealerCode: row.dealerCode,
      expenseTotal: 0,
    };
    current.expenseTotal += row.allocatedAmount;
    expenseByDealerMap.set(row.dealerId, current);
  });

  const expenseByDealer = Array.from(expenseByDealerMap.values()).sort(
    (left, right) => right.expenseTotal - left.expenseTotal,
  );

  const topFinancierMap = new Map<string, TopFinancierRecord>();
  [...filteredDeals, ...filteredDeadDeals].forEach((row) => {
    const financierId = row.financierId ?? "unassigned";
    const financierName = row.financierName ?? "Unassigned";
    const current = topFinancierMap.get(financierId) ?? {
      financierId,
      financierName,
      contributionTotal: 0,
      dealCount: 0,
    };
    current.contributionTotal += row.dealerProfit;
    current.dealCount += 1;
    topFinancierMap.set(financierId, current);
  });

  const topFinanciers = Array.from(topFinancierMap.values())
    .sort((left, right) => right.contributionTotal - left.contributionTotal)
    .slice(0, 5);

  const comparisonMap = new Map<string, MonthlyComparisonPoint>();
  ((comparisonResponse.data ?? []) as Array<Record<string, unknown>>).forEach((row) => {
    const dealerId = String(row.dealer_id);
    const periodMonth = String(row.period_month).slice(0, 10);

    if (!visibleByDealer(dealerId) || !dealerFilter(dealerId)) {
      return;
    }

    const current = comparisonMap.get(periodMonth) ?? {
      periodMonth,
      grossProfitTotal: 0,
      expenseTotal: 0,
      netProfitTotal: 0,
    };

    current.grossProfitTotal += toNumber(row.gross_profit_total);
    current.expenseTotal += toNumber(row.expense_total);
    current.netProfitTotal += toNumber(row.net_profit_total);
    comparisonMap.set(periodMonth, current);
  });

  const comparison = Array.from(comparisonMap.values())
    .sort((left, right) => left.periodMonth.localeCompare(right.periodMonth))
    .slice(-6);

  const dealerPerformanceSorted = [...dealerPerformance].sort(
    (left, right) => right.netProfitTotal - left.netProfitTotal,
  );

  const dealerDetail = params.filters.dealerId
    ? buildDealerDetailReport({
        dealerId: params.filters.dealerId,
        dealerPerformance,
        deals: filteredDeals,
        deadDeals: filteredDeadDeals,
        expenses: filteredExpenseRows,
        payoutRows,
        partnerResults,
        role: params.role,
      })
    : null;

  const summary = summarizeDealerResults(dealerPerformance);

  const partnerDealers = dealerPerformance.map((row) => ({
    dealerId: row.dealerId,
    dealerName: row.dealerName,
    dealerCode: row.dealerCode,
    netProfitTotal: row.netProfitTotal,
    expenseTotal: row.expenseTotal,
  })) satisfies PartnerDealerSnapshot[];

  const pendingPayoutRows = payoutRows.filter((row) => row.paymentStatus === "pending");
  const paidPayoutRows = payoutRows.filter((row) => row.paymentStatus === "paid");
  const partnerName =
    params.role === "partner_viewer" && partnerRecordResponse.data
      ? String((partnerRecordResponse.data as Record<string, unknown>).display_name ?? "")
      : null;

  return {
    role: params.role,
    filters: params.filters,
    dealerOptions: dealers.map(
      (dealer) =>
        ({
          id: dealer.id,
          label: dealer.code > 0 ? `${dealer.name} (#${dealer.code})` : dealer.name,
        }) satisfies DashboardOption,
    ),
    financierOptions: financiers.map(
      (financier) =>
        ({
          id: financier.id,
          label: financier.name,
        }) satisfies DashboardOption,
    ),
    summary: {
      totalNetProfit: summary.totalNetProfit,
      totalExpense: summary.totalExpense,
      totalGrossProfit: summary.totalGrossProfit,
      visibleDealerCount: dealerPerformance.length,
      pendingPayoutCount: pendingPayoutRows.length,
      paidPayoutCount: paidPayoutRows.length,
      pendingPayoutAmount: pendingPayoutRows.reduce(
        (sum, row) => sum + row.partnerAmount,
        0,
      ),
      paidPayoutAmount: paidPayoutRows.reduce(
        (sum, row) => sum + (row.paidAmount ?? row.partnerAmount),
        0,
      ),
    },
    dealerPerformance,
    expenseByDealer,
    payoutRows,
    topFinanciers,
    comparison,
    bestDealers: dealerPerformanceSorted.slice(0, 5),
    worstDealers: [...dealerPerformanceSorted].reverse().slice(0, 5),
    quickSettlementHref: `/settlements?periodMonth=${params.filters.periodMonth}`,
    dealerDetail,
    partnerDealers,
    partnerName,
  };
}

function buildDealerDetailReport(params: {
  dealerId: string;
  dealerPerformance: DealerPerformanceRecord[];
  deals: Array<{
    id: string;
    dealerId: string;
    financierName: string | null;
    vinValue: string;
    date: string;
    dealerProfit: number;
  }>;
  deadDeals: Array<{
    id: string;
    dealerId: string;
    financierName: string | null;
    vinValue: string;
    date: string;
    dealerProfit: number;
  }>;
  expenses: Array<{
    expenseId: string;
    dealerId: string;
    expenseDate: string;
    description: string;
    categoryName: string | null;
    allocatedAmount: number;
  }>;
  payoutRows: DashboardPayoutRecord[];
  partnerResults: Array<{
    dealerId: string;
    partnerId: string;
    partnerName: string;
    sharePercentage: number;
    partnerAmount: number;
  }>;
  role: AppRole;
}): DealerDetailReport | null {
  const dealerSummary = params.dealerPerformance.find(
    (row) => row.dealerId === params.dealerId,
  );

  if (!dealerSummary) {
    return null;
  }

  const deals = [
    ...params.deals
      .filter((row) => row.dealerId === params.dealerId)
      .map(
        (row) =>
          ({
            id: row.id,
            source: "deal",
            date: row.date,
            vin: row.vinValue,
            financierName: row.financierName,
            grossAmount: row.dealerProfit,
            expenseAmount: 0,
            netAmount: row.dealerProfit,
          }) satisfies DealerDetailDealRecord,
      ),
    ...params.deadDeals
      .filter((row) => row.dealerId === params.dealerId)
      .map(
        (row) =>
          ({
            id: row.id,
            source: "dead_deal",
            date: row.date,
            vin: row.vinValue,
            financierName: row.financierName,
            grossAmount: row.dealerProfit,
            expenseAmount: 0,
            netAmount: row.dealerProfit,
          }) satisfies DealerDetailDealRecord,
      ),
  ].sort((left, right) => left.date.localeCompare(right.date));

  const expenses = params.expenses
    .filter((row) => row.dealerId === params.dealerId)
    .map(
      (row) =>
        ({
          expenseId: row.expenseId,
          expenseDate: row.expenseDate,
          description: row.description,
          categoryName: row.categoryName,
          allocatedAmount: row.allocatedAmount,
        }) satisfies DealerDetailExpenseRecord,
    )
    .sort((left, right) => left.expenseDate.localeCompare(right.expenseDate));

  const payoutMap = new Map(
    params.payoutRows
      .filter((row) => row.dealerId === params.dealerId)
      .map((row) => [row.partnerId, row]),
  );

  let partnerDistribution = params.partnerResults
    .filter((row) => row.dealerId === params.dealerId)
    .map(
      (row) =>
        ({
          partnerId: row.partnerId,
          partnerName: row.partnerName,
          sharePercentage: row.sharePercentage,
          amount: row.partnerAmount,
          paymentStatus: payoutMap.get(row.partnerId)?.paymentStatus ?? "pending",
          paidAmount: payoutMap.get(row.partnerId)?.paidAmount ?? null,
        }) satisfies DealerDetailPartnerRecord,
    );

  if (params.role === "partner_viewer") {
    partnerDistribution = partnerDistribution.slice(0, 1);
  }

  return {
    dealerId: dealerSummary.dealerId,
    dealerName: dealerSummary.dealerName,
    dealerCode: dealerSummary.dealerCode,
    grossProfitTotal: dealerSummary.grossProfitTotal,
    expenseTotal: dealerSummary.expenseTotal,
    netProfitTotal: dealerSummary.netProfitTotal,
    deals,
    expenses,
    partnerDistribution,
  };
}
