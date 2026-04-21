import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FinancierRow } from "@/types/database";
import type { FinancierAliasRecord } from "@/features/masters/financiers/types";

export async function getFinanciersPageData() {
  const supabase = createSupabaseAdminClient();
  const [{ data: financiers, error: financiersError }, { data: aliases, error: aliasesError }] =
    await Promise.all([
      supabase
        .from("financiers")
        .select("*")
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("financier_aliases")
        .select("*, financiers!inner(name)")
        .is("deleted_at", null)
        .order("alias"),
    ]);

  if (financiersError || aliasesError) {
    throw new Error("Failed to load financiers page data.");
  }

  return {
    financiers: (financiers ?? []) as FinancierRow[],
    aliases: ((aliases ?? []) as Array<Record<string, unknown> & { financiers: { name: string } }>).map(
      (alias) => ({
        ...(alias as unknown as FinancierAliasRecord),
        financier_name: alias.financiers.name,
      }),
    ),
  };
}
