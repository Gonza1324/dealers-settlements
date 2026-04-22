import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/features/auth/types";
import type {
  SettingsUserRecord,
  SettingsUsersPageData,
} from "@/features/settings/users/types";
import type { PartnerRow, ProfileRow } from "@/types/database";

type AuthUserLookup = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

function mapAuthUser(row: Record<string, unknown>): AuthUserLookup {
  const metadata =
    typeof row.user_metadata === "object" && row.user_metadata !== null
      ? (row.user_metadata as Record<string, unknown>)
      : {};

  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    fullName: String(metadata.full_name ?? ""),
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    lastSignInAt: typeof row.last_sign_in_at === "string" ? row.last_sign_in_at : null,
  };
}

function toRole(value: unknown): AppRole {
  if (value === "super_admin" || value === "expense_admin") {
    return value;
  }

  return "partner_viewer";
}

async function listAuthUsers() {
  const supabase = createSupabaseAdminClient();
  const users: AuthUserLookup[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to load auth users: ${error.message}`);
    }

    const current = (data.users ?? []).map((user) =>
      mapAuthUser(user as unknown as Record<string, unknown>),
    );

    users.push(...current);

    if (current.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

export async function getSettingsUsersPageData(): Promise<SettingsUsersPageData> {
  const supabase = createSupabaseAdminClient();
  const [authUsers, profilesResult, partnersResult] = await Promise.all([
    listAuthUsers(),
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("partners").select("*").is("deleted_at", null).order("display_name"),
  ]);

  if (profilesResult.error || partnersResult.error) {
    throw new Error("Failed to load settings users data.");
  }

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const partners = (partnersResult.data ?? []) as PartnerRow[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const partnerByUserId = new Map(
    partners
      .filter((partner) => partner.user_id)
      .map((partner) => [String(partner.user_id), partner]),
  );

  const users = authUsers
    .map((authUser) => {
      const profile = profileMap.get(authUser.id) ?? null;
      const linkedPartner = partnerByUserId.get(authUser.id) ?? null;
      const role = toRole(profile?.role);
      const fullName = profile?.full_name?.trim() || authUser.fullName || authUser.email;

      return {
        id: authUser.id,
        email: profile?.email ?? authUser.email,
        fullName,
        role,
        isActive: profile?.is_active ?? true,
        hasProfile: Boolean(profile),
        partnerId: linkedPartner?.id ?? null,
        partnerName: linkedPartner?.display_name ?? null,
        needsPartnerAssignmentWarning:
          role === "partner_viewer" && linkedPartner === null,
        createdAt: authUser.createdAt,
        lastSignInAt: authUser.lastSignInAt,
      } satisfies SettingsUserRecord;
    })
    .sort((left, right) => {
      const leftKey = `${left.fullName}|${left.email}`.toLowerCase();
      const rightKey = `${right.fullName}|${right.email}`.toLowerCase();

      return leftKey.localeCompare(rightKey);
    });

  return { users };
}
