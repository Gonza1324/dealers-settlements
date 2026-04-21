import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PartnerRow, ProfileRow } from "@/types/database";

export async function getPartnersPageData() {
  const supabase = createSupabaseAdminClient();

  const [{ data: partners, error: partnersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase
        .from("partners")
        .select("*")
        .is("deleted_at", null)
        .order("display_name"),
      supabase
        .from("profiles")
        .select("*")
        .order("full_name"),
    ]);

  if (partnersError || profilesError) {
    throw new Error("Failed to load partners page data.");
  }

  return {
    partners: (partners ?? []) as PartnerRow[],
    profiles: (profiles ?? []) as ProfileRow[],
  };
}
