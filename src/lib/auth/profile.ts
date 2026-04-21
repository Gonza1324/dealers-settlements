import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-session";
import type { ProfileSummary } from "@/features/auth/types";

function mapProfile(record: Record<string, unknown>): ProfileSummary {
  return {
    id: String(record.id),
    fullName: String(record.full_name ?? ""),
    email: typeof record.email === "string" ? record.email : null,
    role:
      record.role === "super_admin" ||
      record.role === "expense_admin" ||
      record.role === "partner_viewer"
        ? record.role
        : "partner_viewer",
    isActive: Boolean(record.is_active),
  };
}

async function ensureProfileForUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: unknown } | null;
}) {
  const supabase = createSupabaseAdminClient();

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return null;
  }

  if (existingProfile) {
    return mapProfile(existingProfile as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "",
        role: "partner_viewer",
        is_active: true,
      },
    )
    .select("id, full_name, email, role, is_active")
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfile(data as Record<string, unknown>);
}

export const getCurrentProfile = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", user.id)
    .single();

  if (data) {
    return mapProfile(data as Record<string, unknown>);
  }

  if (error?.code !== "PGRST116") {
    return null;
  }

  return ensureProfileForUser({
    id: user.id,
    email: user.email,
    user_metadata:
      typeof user.user_metadata === "object" && user.user_metadata !== null
        ? (user.user_metadata as { full_name?: unknown })
        : null,
  });
});

export async function requireAuthenticatedProfile() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  if (!profile || !profile.isActive) {
    redirect("/login?error=profile");
  }

  return profile;
}
