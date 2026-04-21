import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  DealerShareResolution,
  RunCalculationResult,
} from "@/features/settlements/types";

export async function runMonthlyCalculation(params: {
  periodMonth: string;
  actorUserId: string;
  notes?: string;
}): Promise<RunCalculationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("run_monthly_calculation", {
    p_period_month: params.periodMonth,
    p_actor_user_id: params.actorUserId,
    p_notes: params.notes ?? null,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to run monthly calculation.");
  }

  const result = data as {
    runId: string;
    status: "draft" | "completed" | "failed";
    summary: {
      dealersCalculated: number;
      partnersCalculated: number;
      grossTotal: number;
      expenseTotal: number;
      netTotal: number;
      errorCount: number;
    };
    errors: Array<{
      dealerId: string | null;
      dealerName: string | null;
      message: string;
    }>;
  };

  return {
    runId: result.runId,
    status: result.status,
    summary: result.summary,
    errors: result.errors,
  };
}

export async function resolveDealerSharesForMonth(
  dealerId: string,
  periodMonth: string,
): Promise<DealerShareResolution> {
  const supabase = createSupabaseAdminClient();
  const { data: dealer, error: dealerError } = await supabase
    .from("dealers")
    .select("id, name")
    .eq("id", dealerId)
    .single();

  if (dealerError || !dealer) {
    throw new Error("Dealer not found.");
  }

  const { data, error } = await supabase
    .from("dealer_partner_shares")
    .select("share_percentage, partners!inner(id, display_name)")
    .eq("dealer_id", dealerId)
    .is("deleted_at", null)
    .lte("valid_from", periodMonth)
    .or(`valid_to.is.null,valid_to.gte.${periodMonth}`);

  if (error) {
    throw new Error(`Failed to resolve dealer shares: ${error.message}`);
  }

  const shares = (data ?? []).map((row) => ({
    partnerId: String((row.partners as { id?: string } | null)?.id ?? ""),
    partnerName: String(
      (row.partners as { display_name?: string } | null)?.display_name ?? "",
    ),
    percentage: Number(row.share_percentage ?? 0),
  }));

  const totalPercentage = Number(
    shares.reduce((sum, share) => sum + share.percentage, 0).toFixed(2),
  );

  return {
    dealerId,
    dealerName: String(dealer.name),
    shares,
    totalPercentage,
    isValid: shares.length > 0 && totalPercentage === 100,
  };
}
