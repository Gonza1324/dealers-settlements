import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AppRole,
  DealerMonthlyResultRow,
  MonthlyCalculationRunRow,
  PartnerMonthlyPayoutRow,
  PartnerMonthlyResultRow,
  PaymentStatus,
} from "@/types/database";
import type {
  DealerMonthlyResultRecord,
  MonthlyCalculationRunRecord,
  PartnerMonthlyResultRecord,
  SettlementFilters,
  SettlementPageData,
  SettlementPartnerScope,
  SettlementRunDetailData,
} from "@/features/settlements/types";

function mapRunRecord(
  row: Record<string, unknown> & {
    profiles?: { full_name?: string; email?: string } | null;
  },
): MonthlyCalculationRunRecord {
  const summary = (row.summary_json as Record<string, unknown> | null) ?? {};
  const errors = Array.isArray(row.error_messages) ? row.error_messages : [];

  return {
    ...(row as unknown as MonthlyCalculationRunRow),
    summary_json: {
      dealersCalculated: Number(summary.dealersCalculated ?? 0),
      partnersCalculated: Number(summary.partnersCalculated ?? 0),
      grossTotal: Number(summary.grossTotal ?? 0),
      expenseTotal: Number(summary.expenseTotal ?? 0),
      netTotal: Number(summary.netTotal ?? 0),
      errorCount: Number(summary.errorCount ?? 0),
    },
    error_messages: errors.map((error) => {
      const current = error as Record<string, unknown>;
      return {
        dealerId:
          typeof current.dealerId === "string" ? current.dealerId : null,
        dealerName:
          typeof current.dealerName === "string" ? current.dealerName : null,
        message: String(current.message ?? ""),
      };
    }),
    triggered_by_name:
      typeof row.profiles?.full_name === "string" ? row.profiles.full_name : null,
    triggered_by_email:
      typeof row.profiles?.email === "string" ? row.profiles.email : null,
  };
}

function mapDealerResult(
  row: Record<string, unknown> & { dealers?: { name?: string; code?: number } | null },
): DealerMonthlyResultRecord {
  return {
    ...(row as unknown as DealerMonthlyResultRow),
    dealer_name: String(row.dealers?.name ?? ""),
    dealer_code:
      typeof row.dealers?.code === "number" ? row.dealers.code : Number(row.dealers?.code ?? 0),
  };
}

function mapPartnerResult(
  row: Record<string, unknown> & {
    dealers?: { name?: string; code?: number } | null;
    partners?: { display_name?: string; profiles?: { email?: string } | null } | null;
  },
): PartnerMonthlyResultRecord {
  return {
    ...(row as unknown as PartnerMonthlyResultRow),
    dealer_name: String(row.dealers?.name ?? ""),
    dealer_code:
      typeof row.dealers?.code === "number" ? row.dealers.code : Number(row.dealers?.code ?? 0),
    partner_name: String(row.partners?.display_name ?? ""),
    partner_user_email:
      typeof row.partners?.profiles?.email === "string"
        ? row.partners.profiles.email
        : null,
    payout_id: null,
    payout_status: "pending" satisfies PaymentStatus,
    paid_amount: null,
    paid_at: null,
    payment_method: null,
    payment_note: null,
    payment_attachment_path: null,
    payment_attachment_url: null,
  };
}

function buildPayoutKey(params: {
  dealerId: string;
  partnerId: string;
  periodMonth: string;
}) {
  return `${params.dealerId}::${params.partnerId}::${params.periodMonth}`;
}

function applyPayoutsToPartnerResults(params: {
  partnerResults: PartnerMonthlyResultRecord[];
  payouts: PartnerMonthlyPayoutRow[];
}) {
  const payoutMap = new Map(
    params.payouts.map((payout) => [
      buildPayoutKey({
        dealerId: payout.dealer_id,
        partnerId: payout.partner_id,
        periodMonth: payout.period_month,
      }),
      payout,
    ]),
  );

  return params.partnerResults.map((result) => {
    const payout = payoutMap.get(
      buildPayoutKey({
        dealerId: result.dealer_id,
        partnerId: result.partner_id,
        periodMonth: result.period_month,
      }),
    );
    const payoutStatus: PaymentStatus =
      payout?.payment_status === "paid" ? "paid" : "pending";

    return {
      ...result,
      payout_id: payout?.id ?? null,
      payout_status: payoutStatus,
      paid_amount: payout?.paid_amount ?? null,
      paid_at: payout?.paid_at ? String(payout.paid_at).slice(0, 10) : null,
      payment_method: payout?.payment_method ?? null,
      payment_note: payout?.payment_note ?? null,
      payment_attachment_path: payout?.payment_attachment_path ?? null,
    };
  });
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
  })) satisfies SettlementPartnerScope[];
}

function dealerVisibleToPartner(
  dealerId: string,
  periodMonth: string,
  scopes: SettlementPartnerScope[],
) {
  return scopes.some(
    (scope) =>
      scope.dealerId === dealerId &&
      periodMonth >= scope.validFrom &&
      (scope.validTo === null || periodMonth <= scope.validTo),
  );
}

async function maybeCreateAttachmentUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(env.settlementAttachmentBucketName)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export async function getSettlementsPageData(params: {
  filters: SettlementFilters;
  profileId: string;
  role: AppRole;
}): Promise<SettlementPageData> {
  const supabase = createSupabaseAdminClient();
  const [runsResult, dealerResultRows, partnerResultRows, payoutRows] = await Promise.all([
    supabase
      .from("monthly_calculation_runs")
      .select("*, profiles(full_name, email)")
      .order("period_month", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("dealer_monthly_results")
      .select("*, dealers!inner(name, code), monthly_calculation_runs!inner(is_current)")
      .eq("monthly_calculation_runs.is_current", true)
      .order("period_month", { ascending: false }),
    supabase
      .from("partner_monthly_results")
      .select(
        "*, dealers!inner(name, code), partners!inner(display_name, profiles(email))",
      )
      .order("period_month", { ascending: false }),
    supabase
      .from("partner_monthly_payouts")
      .select("*")
      .order("period_month", { ascending: false }),
  ]);

  if (
    runsResult.error ||
    dealerResultRows.error ||
    partnerResultRows.error ||
    payoutRows.error
  ) {
    throw new Error("Failed to load settlements data.");
  }

  let runs = ((runsResult.data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapRunRecord(
      row as Record<string, unknown> & {
        profiles?: { full_name?: string; email?: string } | null;
      },
    ),
  );
  let dealerResults = ((dealerResultRows.data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapDealerResult(
      row as Record<string, unknown> & {
        dealers?: { name?: string; code?: number } | null;
      },
    ),
  );
  let partnerResults = ((partnerResultRows.data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapPartnerResult(
      row as Record<string, unknown> & {
        dealers?: { name?: string; code?: number } | null;
        partners?: { display_name?: string; profiles?: { email?: string } | null } | null;
      },
    ),
  );
  partnerResults = applyPayoutsToPartnerResults({
    partnerResults,
    payouts: (payoutRows.data ?? []) as PartnerMonthlyPayoutRow[],
  });

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    dealerResults = dealerResults.filter((result) =>
      dealerVisibleToPartner(result.dealer_id, result.period_month, scopes),
    );
    partnerResults = partnerResults.filter((result) =>
      dealerVisibleToPartner(result.dealer_id, result.period_month, scopes),
    );
    const visibleRunIds = new Set([
      ...dealerResults.map((result) => result.calculation_run_id),
      ...partnerResults.map((result) => result.calculation_run_id),
    ]);
    runs = runs.filter((run) => visibleRunIds.has(run.id));
  }

  if (params.filters.periodMonth) {
    const month = `${params.filters.periodMonth}-01`;
    runs = runs.filter((run) => run.period_month === month);
    dealerResults = dealerResults.filter((result) => result.period_month === month);
    partnerResults = partnerResults.filter((result) => result.period_month === month);
  }

  const currentRun = runs.find((run) => run.is_current) ?? null;
  const currentPartnerResults = currentRun
    ? partnerResults.filter((result) => result.calculation_run_id === currentRun.id)
    : [];

  for (const result of currentPartnerResults) {
    result.payment_attachment_url = await maybeCreateAttachmentUrl(
      result.payment_attachment_path,
    );
  }

  return {
    runs,
    currentRun,
    currentDealerResults: currentRun
      ? dealerResults.filter((result) => result.calculation_run_id === currentRun.id)
      : [],
    currentPartnerResults,
    filters: params.filters,
  };
}

export async function getSettlementRunDetailData(params: {
  runId: string;
  profileId: string;
  role: AppRole;
}): Promise<SettlementRunDetailData> {
  const supabase = createSupabaseAdminClient();
  const [{ data: run, error: runError }, dealerRows, partnerRows, payoutRows] = await Promise.all([
    supabase
      .from("monthly_calculation_runs")
      .select("*, profiles(full_name, email)")
      .eq("id", params.runId)
      .single(),
    supabase
      .from("dealer_monthly_results")
      .select("*, dealers!inner(name, code)")
      .eq("calculation_run_id", params.runId)
      .order("dealer_id"),
    supabase
      .from("partner_monthly_results")
      .select(
        "*, dealers!inner(name, code), partners!inner(display_name, profiles(email))",
      )
      .eq("calculation_run_id", params.runId)
      .order("dealer_id")
      .order("partner_id"),
    supabase.from("partner_monthly_payouts").select("*").order("period_month", { ascending: false }),
  ]);

  if (runError || !run || dealerRows.error || partnerRows.error || payoutRows.error) {
    throw new Error("Settlement run not found.");
  }

  const mappedRun = mapRunRecord(
    run as Record<string, unknown> & {
      profiles?: { full_name?: string; email?: string } | null;
    },
  );
  let dealerResults = ((dealerRows.data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapDealerResult(
      row as Record<string, unknown> & {
        dealers?: { name?: string; code?: number } | null;
      },
    ),
  );
  let partnerResults = ((partnerRows.data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapPartnerResult(
      row as Record<string, unknown> & {
        dealers?: { name?: string; code?: number } | null;
        partners?: { display_name?: string; profiles?: { email?: string } | null } | null;
      },
    ),
  );
  partnerResults = applyPayoutsToPartnerResults({
    partnerResults,
    payouts: (payoutRows.data ?? []) as PartnerMonthlyPayoutRow[],
  });

  if (params.role === "partner_viewer") {
    const scopes = await getPartnerShareScopes(params.profileId);
    dealerResults = dealerResults.filter((result) =>
      dealerVisibleToPartner(result.dealer_id, result.period_month, scopes),
    );
    partnerResults = partnerResults.filter((result) =>
      dealerVisibleToPartner(result.dealer_id, result.period_month, scopes),
    );
  }

  for (const result of partnerResults) {
    result.payment_attachment_url = await maybeCreateAttachmentUrl(
      result.payment_attachment_path,
    );
  }

  return {
    run: mappedRun,
    dealerResults,
    partnerResults,
  };
}
