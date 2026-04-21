import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDateActive } from "@/features/masters/shared/utils";
import type { DealersPageData, DealerShareRecord, DealerAssignmentRecord } from "@/features/masters/dealers/types";
import type { AppRole, DealerRow, FinancierRow, PartnerRow, ProfileRow } from "@/types/database";

function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

export async function getDealersPageData(params: {
  role: AppRole;
  profileId: string;
}): Promise<DealersPageData> {
  const supabase = createSupabaseAdminClient();

  const [{ data: dealersData, error: dealersError }, { data: sharesData, error: sharesError }] =
    await Promise.all([
      supabase
        .from("dealers")
        .select("*")
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("dealer_partner_shares")
        .select("*, dealers!inner(name), partners!inner(display_name, user_id)")
        .is("deleted_at", null)
        .order("valid_from", { ascending: false }),
    ]);

  if (dealersError) {
    throw new Error(`Failed to load dealers: ${dealersError.message}`);
  }

  if (sharesError) {
    throw new Error(`Failed to load shares: ${sharesError.message}`);
  }

  const allShares = (sharesData ?? []) as Array<
    Record<string, unknown> & {
      dealers: { name: string };
      partners: { display_name: string; user_id: string | null };
    }
  >;

  const visibleDealerIds =
    params.role === "partner_viewer"
      ? [
          ...new Set(
            allShares
              .filter((share) => share.partners?.user_id === params.profileId)
              .map((share) => String(share.dealer_id)),
          ),
        ]
      : null;

  const dealers = ((dealersData ?? []) as DealerRow[])
    .filter((dealer) => !visibleDealerIds || visibleDealerIds.includes(dealer.id))
    .map((dealer) => {
      const today = new Date().toISOString().slice(0, 10);
      const activeShares = allShares.filter(
        (share) =>
          share.dealer_id === dealer.id &&
          isDateActive(
            today,
            String(share.valid_from),
            share.valid_to ? String(share.valid_to) : null,
          ),
      );

      const currentShareTotal = activeShares.reduce(
        (total, share) => total + toNumber(String(share.share_percentage)),
        0,
      );

      return {
        ...dealer,
        currentShareTotal,
        shareAlert: currentShareTotal !== 100,
      };
    });

  const dealerIds = dealers.map((dealer) => dealer.id);

  const [{ data: assignmentsData, error: assignmentsError }, { data: partnersData, error: partnersError }, { data: financiersData, error: financiersError }, { data: profilesData, error: profilesError }] =
    await Promise.all([
      supabase
        .from("dealer_financier_assignments")
        .select("*, dealers!inner(name), financiers!inner(name)")
        .is("deleted_at", null)
        .order("start_date", { ascending: false }),
      supabase
        .from("partners")
        .select("*")
        .is("deleted_at", null)
        .order("display_name"),
      supabase
        .from("financiers")
        .select("*")
        .is("deleted_at", null)
        .order("name"),
      supabase.from("profiles").select("*").order("full_name"),
    ]);

  if (assignmentsError) {
    throw new Error(`Failed to load assignments: ${assignmentsError.message}`);
  }

  if (partnersError || financiersError || profilesError) {
    throw new Error("Failed to load master data selectors.");
  }

  const shares: DealerShareRecord[] = allShares
    .filter((share) => dealerIds.includes(String(share.dealer_id)))
    .map((share) => ({
      ...(share as unknown as DealerShareRecord),
      dealer_name: share.dealers.name,
      partner_name: share.partners.display_name,
    }));

  const assignments: DealerAssignmentRecord[] = (
    (assignmentsData ?? []) as Array<
      Record<string, unknown> & {
        dealers: { name: string };
        financiers: { name: string };
      }
    >
  )
    .filter((assignment) => dealerIds.includes(String(assignment.dealer_id)))
    .map((assignment) => ({
      ...(assignment as unknown as DealerAssignmentRecord),
      dealer_name: assignment.dealers.name,
      financier_name: assignment.financiers.name,
    }));

  return {
    dealers,
    shares,
    assignments,
    partners: (partnersData ?? []) as PartnerRow[],
    financiers: (financiersData ?? []) as FinancierRow[],
    profiles: (profilesData ?? []) as ProfileRow[],
  };
}
