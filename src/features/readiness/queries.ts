import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ReadinessAlert,
  ReadinessCheck,
  ReadinessPageData,
  ReadinessPeriodOption,
  ReadinessSeverity,
} from "@/features/readiness/types";

function toMonthStart(periodMonth: string) {
  return `${periodMonth}-01`;
}

function toPeriodMonth(dateValue: string) {
  return dateValue.slice(0, 7);
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function getRelatedRows(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function severityWeight(severity: ReadinessSeverity) {
  if (severity === "critical") {
    return 18;
  }

  if (severity === "warning") {
    return 8;
  }

  return 3;
}

function buildScore(alerts: ReadinessAlert[]) {
  const penalty = alerts.reduce((sum, alert) => sum + severityWeight(alert.severity), 0);

  return Math.max(0, Math.min(100, 100 - penalty));
}

function addAlert(
  alerts: ReadinessAlert[],
  alert: Omit<ReadinessAlert, "id">,
) {
  alerts.push({
    ...alert,
    id: `${alert.category}:${alert.title}:${alerts.length}`,
  });
}

export async function getReadinessPageData(params: {
  periodMonth: string;
}): Promise<ReadinessPageData> {
  const supabase = createSupabaseAdminClient();

  const [periodSources, allDealersResponse] = await Promise.all([
    Promise.all([
      supabase.from("deals").select("period_month").is("deleted_at", null),
      supabase.from("dead_deals").select("period_month").is("deleted_at", null),
      supabase.from("expenses").select("period_month").is("deleted_at", null),
      supabase.from("monthly_calculation_runs").select("period_month"),
    ]),
    supabase
      .from("dealers")
      .select("id, name, code, status")
      .is("deleted_at", null)
      .order("name"),
  ]);

  if (periodSources.some((source) => source.error) || allDealersResponse.error) {
    throw new Error("Failed to load readiness filter data.");
  }

  const periodValues = new Set<string>();
  for (const source of periodSources) {
    for (const row of (source.data ?? []) as Array<{ period_month?: string }>) {
      if (row.period_month) {
        periodValues.add(toPeriodMonth(row.period_month));
      }
    }
  }

  const periodOptions: ReadinessPeriodOption[] = [...periodValues]
    .sort()
    .reverse()
    .map((period) => ({ label: period, value: period }));
  const selectedPeriodMonth =
    params.periodMonth || periodOptions[0]?.value || new Date().toISOString().slice(0, 7);
  const periodMonthDate = toMonthStart(selectedPeriodMonth);

  const [
    dealsResponse,
    deadDealsResponse,
    expensesResponse,
    sharesResponse,
    runsResponse,
    payoutResponse,
  ] = await Promise.all([
    supabase
      .from("deals")
      .select("id, dealer_id, financier_id, vin_value, deal_profit, is_manually_edited, dealers!inner(name, code)")
      .eq("period_month", periodMonthDate)
      .is("deleted_at", null),
    supabase
      .from("dead_deals")
      .select("id, dealer_id, financier_id, vin_value, dealer_profit, dealers!inner(name, code)")
      .eq("period_month", periodMonthDate)
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("id, description, amount, scope_type, expense_allocations(id, dealer_id, allocated_amount, dealers(name, code))")
      .eq("period_month", periodMonthDate)
      .is("deleted_at", null),
    supabase
      .from("dealer_partner_shares")
      .select("id, dealer_id, partner_id, share_percentage, valid_from, valid_to, dealers!inner(name, code), partners!inner(display_name)")
      .is("deleted_at", null)
      .lte("valid_from", periodMonthDate)
      .or(`valid_to.is.null,valid_to.gte.${periodMonthDate}`),
    supabase
      .from("monthly_calculation_runs")
      .select("id, period_month, status, is_current, error_messages, summary_json")
      .eq("period_month", periodMonthDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_monthly_payouts")
      .select("id, period_month, payment_status, paid_amount")
      .lt("period_month", periodMonthDate),
  ]);

  if (
    dealsResponse.error ||
    deadDealsResponse.error ||
    expensesResponse.error ||
    sharesResponse.error ||
    runsResponse.error ||
    payoutResponse.error
  ) {
    throw new Error("Failed to load readiness data.");
  }

  const dealers = ((allDealersResponse.data ?? []) as Array<Record<string, unknown>>).map(
    (dealer) => ({
      id: String(dealer.id),
      label: `${String(dealer.name)} #${Number(dealer.code)}`,
      status: String(dealer.status),
    }),
  );
  const deals = (dealsResponse.data ?? []) as Array<Record<string, unknown>>;
  const deadDeals = (deadDealsResponse.data ?? []) as Array<Record<string, unknown>>;
  const expenses = (expensesResponse.data ?? []) as Array<Record<string, unknown>>;
  const shares = (sharesResponse.data ?? []) as Array<Record<string, unknown>>;
  const runs = (runsResponse.data ?? []) as Array<Record<string, unknown>>;
  const payouts = (payoutResponse.data ?? []) as Array<Record<string, unknown>>;
  const alerts: ReadinessAlert[] = [];

  const activeDealers = dealers.filter((dealer) => dealer.status === "active");
  const activeDealerIds = new Set(activeDealers.map((dealer) => dealer.id));
  const activityDealerIds = new Set<string>();
  for (const row of [...deals, ...deadDeals]) {
    activityDealerIds.add(String(row.dealer_id));
  }
  for (const expense of expenses) {
    for (const allocation of getRelatedRows(expense.expense_allocations)) {
      activityDealerIds.add(String((allocation as Record<string, unknown>).dealer_id));
    }
  }

  const dealsMissingFinancier = deals.filter((deal) => !deal.financier_id);
  if (dealsMissingFinancier.length > 0) {
    addAlert(alerts, {
      category: "Data quality",
      ctaHref: `/deals?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Open deals",
      description: `${dealsMissingFinancier.length} consolidated deals are missing a financista assignment.`,
      severity: "critical",
      title: "Deals missing financista",
    });
  }

  const deadDealsMissingFinancier = deadDeals.filter((deal) => !deal.financier_id);
  if (deadDealsMissingFinancier.length > 0) {
    addAlert(alerts, {
      category: "Data quality",
      ctaHref: `/dead-deals?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Open dead deals",
      description: `${deadDealsMissingFinancier.length} dead deals are missing a financista assignment.`,
      severity: "warning",
      title: "Dead deals missing financista",
    });
  }

  const vinCounts = new Map<string, number>();
  for (const row of [...deals, ...deadDeals]) {
    const vin = String(row.vin_value ?? "").trim().toUpperCase();
    if (vin) {
      vinCounts.set(vin, (vinCounts.get(vin) ?? 0) + 1);
    }
  }
  const duplicateVins = [...vinCounts.entries()].filter(([, count]) => count > 1);
  if (duplicateVins.length > 0) {
    addAlert(alerts, {
      category: "Data quality",
      ctaHref: `/deals?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Review VINs",
      description: `${duplicateVins.length} VINs appear more than once across deals and dead deals.`,
      severity: "critical",
      title: "Possible duplicate VINs",
    });
  }

  const shareTotals = new Map<string, { dealerLabel: string; total: number; count: number }>();
  for (const share of shares) {
    const dealerId = String(share.dealer_id);
    if (!activeDealerIds.has(dealerId) && !activityDealerIds.has(dealerId)) {
      continue;
    }

    const dealer = share.dealers as { name?: string; code?: unknown } | null;
    const current = shareTotals.get(dealerId) ?? {
      dealerLabel: `${dealer?.name ?? "Dealer"} #${Number(dealer?.code ?? 0)}`,
      total: 0,
      count: 0,
    };
    current.total += toNumber(share.share_percentage);
    current.count += 1;
    shareTotals.set(dealerId, current);
  }

  const dealersWithoutShares = [...activityDealerIds]
    .filter((dealerId) => activeDealerIds.has(dealerId))
    .filter((dealerId) => !shareTotals.has(dealerId));
  if (dealersWithoutShares.length > 0) {
    addAlert(alerts, {
      category: "Partner shares",
      ctaHref: "/dealers",
      ctaLabel: "Open dealers",
      description: `${dealersWithoutShares.length} active dealers with activity have no valid partner shares for ${selectedPeriodMonth}.`,
      severity: "critical",
      title: "Dealers without valid partner shares",
    });
  }

  const invalidShareTotals = [...shareTotals.values()].filter(
    (shareTotal) => Math.abs(shareTotal.total - 100) > 0.01,
  );
  if (invalidShareTotals.length > 0) {
    addAlert(alerts, {
      category: "Partner shares",
      ctaHref: "/dealers",
      ctaLabel: "Review shares",
      description: `${invalidShareTotals.length} dealers have partner shares that do not add up to 100%.`,
      severity: "critical",
      title: "Partner shares not balanced",
    });
  }

  const expensesWithoutAllocations = expenses.filter(
    (expense) => getRelatedRows(expense.expense_allocations).length === 0,
  );
  if (expensesWithoutAllocations.length > 0) {
    addAlert(alerts, {
      category: "Expenses",
      ctaHref: `/expenses?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Open expenses",
      description: `${expensesWithoutAllocations.length} expenses have no allocations.`,
      severity: "critical",
      title: "Expenses without allocations",
    });
  }

  const negativeProfitDeals = deals.filter((deal) => toNumber(deal.deal_profit) < 0);
  if (negativeProfitDeals.length > 0) {
    addAlert(alerts, {
      category: "Data quality",
      ctaHref: `/deals?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Review deals",
      description: `${negativeProfitDeals.length} deals have negative deal profit.`,
      severity: "warning",
      title: "Negative deal profit",
    });
  }

  const currentRun = runs.find((run) => Boolean(run.is_current)) ?? runs[0] ?? null;
  if (!currentRun) {
    addAlert(alerts, {
      category: "Settlements",
      ctaHref: `/settlements?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Open settlements",
      description: "This period has operational data but no settlement calculation run yet.",
      severity: "warning",
      title: "No settlement run",
    });
  } else if (String(currentRun.status) === "failed") {
    addAlert(alerts, {
      category: "Settlements",
      ctaHref: `/settlements?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Open settlements",
      description: "The current settlement run failed and should be recalculated after fixing errors.",
      severity: "critical",
      title: "Settlement run failed",
    });
  }

  const runErrors = runs.reduce((sum, run) => {
    const errors = Array.isArray(run.error_messages) ? run.error_messages.length : 0;
    const summary = run.summary_json as Record<string, unknown> | null;
    return sum + Math.max(errors, toNumber(summary?.errorCount));
  }, 0);
  if (runErrors > 0) {
    addAlert(alerts, {
      category: "Settlements",
      ctaHref: `/settlements?periodMonth=${selectedPeriodMonth}`,
      ctaLabel: "Review run",
      description: `${runErrors} settlement calculation errors are recorded for this period.`,
      severity: "critical",
      title: "Settlement run has errors",
    });
  }

  const priorOpenPayouts = payouts.filter((payout) => payout.payment_status !== "paid");
  if (priorOpenPayouts.length > 0) {
    addAlert(alerts, {
      category: "Payouts",
      ctaHref: "/settlements",
      ctaLabel: "Open payouts",
      description: `${priorOpenPayouts.length} payouts from earlier periods are still pending or partial.`,
      severity: "info",
      title: "Prior period payouts still open",
    });
  }

  const checks: ReadinessCheck[] = [
    {
      count: deals.length,
      description: "Consolidated deal rows in scope.",
      label: "Deals",
      tone: deals.length > 0 ? "success" : "warning",
    },
    {
      count: expenses.length,
      description: "Expense rows allocated to the period.",
      label: "Expenses",
      tone: expensesWithoutAllocations.length > 0 ? "danger" : "success",
    },
    {
      count: shareTotals.size,
      description: "Dealers with valid partner shares in the period.",
      label: "Partner share sets",
      tone: invalidShareTotals.length > 0 || dealersWithoutShares.length > 0 ? "danger" : "success",
    },
    {
      count: runs.length,
      description: "Settlement calculation runs for the period.",
      label: "Settlement runs",
      tone: !currentRun ? "warning" : String(currentRun.status) === "failed" ? "danger" : "success",
    },
  ];
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = alerts.filter((alert) => alert.severity === "warning").length;
  const infoCount = alerts.filter((alert) => alert.severity === "info").length;

  return {
    alerts: alerts.sort(
      (left, right) =>
        severityWeight(right.severity) - severityWeight(left.severity) ||
        left.category.localeCompare(right.category),
    ),
    checks,
    periodOptions,
    selectedPeriodMonth,
    summary: {
      criticalCount,
      warningCount,
      infoCount,
      readinessScore: buildScore(alerts),
      totalAlerts: alerts.length,
    },
  };
}
