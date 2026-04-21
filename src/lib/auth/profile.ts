import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  if (error || !data) {
    return null;
  }

  return mapProfile(data as Record<string, unknown>);
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
