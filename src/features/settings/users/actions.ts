"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdminAccess } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-session";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import {
  initialFormState,
  type FormActionState,
} from "@/features/masters/shared/form-state";
import {
  settingsUserResetSchema,
  settingsUserSchema,
  settingsUserStatusSchema,
} from "@/features/settings/users/schema";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

async function getAppBaseUrl() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return "http://localhost:3000";
}

function buildProfilePayload(params: {
  id: string;
  email: string;
  fullName: string;
  role: "super_admin" | "expense_admin" | "partner_viewer";
  isActive: boolean;
}) {
  return {
    id: params.id,
    email: params.email,
    full_name: params.fullName,
    role: params.role,
    is_active: params.isActive,
  };
}

export async function saveSettingsUser(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = settingsUserSchema.safeParse({
    id: formData.get("id") || "",
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    isActive: formData.get("isActive") || "true",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid user form.");
  }

  const payload = parsed.data;
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();

  if (payload.id && currentUser?.id === payload.id && !payload.isActive) {
    return fail("You cannot deactivate your own account.");
  }

  if (payload.id) {
    const { data: beforeProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", payload.id)
      .maybeSingle();

    const { error: authError } = await supabase.auth.admin.updateUserById(payload.id, {
      email: payload.email,
      user_metadata: { full_name: payload.fullName },
    });

    if (authError) {
      return fail(authError.message);
    }

    const { error: profileError, data: afterProfile } = await supabase
      .from("profiles")
      .upsert(
        buildProfilePayload({
          id: payload.id,
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          isActive: payload.isActive,
        }),
      )
      .select("*")
      .single();

    if (profileError) {
      return fail(profileError.message);
    }

    await writeAuditLog({
      actorUserId: currentUser?.id ?? null,
      entityTable: "profiles",
      entityId: payload.id,
      action: "settings_user_updated",
      before: (beforeProfile ?? null) as Record<string, unknown> | null,
      after: (afterProfile ?? null) as Record<string, unknown> | null,
      metadata: { module: "settings", role: payload.role },
    });
  } else {
    const redirectTo = `${await getAppBaseUrl()}/auth/update-password`;
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(payload.email, {
      redirectTo,
      data: { full_name: payload.fullName },
    });

    if (error || !data.user) {
      return fail(error?.message ?? "Failed to create auth user.");
    }

    const { error: profileError, data: afterProfile } = await supabase
      .from("profiles")
      .upsert(
        buildProfilePayload({
          id: data.user.id,
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          isActive: payload.isActive,
        }),
      )
      .select("*")
      .single();

    if (profileError) {
      return fail(profileError.message);
    }

    await writeAuditLog({
      actorUserId: currentUser?.id ?? null,
      entityTable: "profiles",
      entityId: data.user.id,
      action: "settings_user_created",
      before: null,
      after: (afterProfile ?? null) as Record<string, unknown> | null,
      metadata: { module: "settings", invited: true, role: payload.role },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/partners");

  return {
    success: true,
    message: payload.id ? "User updated." : "User created and invited.",
    error: null,
  };
}

export async function toggleSettingsUserActiveStatus(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = settingsUserStatusSchema.safeParse({
    userId: formData.get("userId"),
    email: formData.get("email"),
    nextIsActive: formData.get("nextIsActive"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid status change.");
  }

  const payload = parsed.data;
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();

  if (currentUser?.id === payload.userId && !payload.nextIsActive) {
    return fail("You cannot deactivate your own account.");
  }

  const { data: before } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", payload.userId)
    .maybeSingle();

  const { data: after, error } = await supabase
    .from("profiles")
    .update({ is_active: payload.nextIsActive, email: payload.email })
    .eq("id", payload.userId)
    .select("*")
    .single();

  if (error) {
    return fail(error.message);
  }

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "profiles",
    entityId: payload.userId,
    action: payload.nextIsActive
      ? "settings_user_activated"
      : "settings_user_deactivated",
    before: (before ?? null) as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: { module: "settings" },
  });

  revalidatePath("/settings");

  return {
    success: true,
    message: payload.nextIsActive ? "User activated." : "User deactivated.",
    error: null,
  };
}

export async function sendSettingsUserPasswordReset(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = settingsUserResetSchema.safeParse({
    userId: formData.get("userId"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid reset request.");
  }

  const payload = parsed.data;
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();
  const redirectTo = `${await getAppBaseUrl()}/auth/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
    redirectTo,
  });

  if (error) {
    return fail(error.message);
  }

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "profiles",
    entityId: payload.userId,
    action: "settings_user_password_reset_sent",
    before: null,
    after: { email: payload.email },
    metadata: { module: "settings", redirectTo },
  });

  return {
    success: true,
    message: "Password reset email sent.",
    error: null,
  };
}
