"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-session";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { aliasSchema, financierSchema } from "@/features/masters/financiers/schema";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";
import { normalizeAlias } from "@/features/masters/shared/utils";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

export async function saveFinancier(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = financierSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    is_active: formData.get("is_active") || "true",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid financier form.");
  }

  const supabase = createSupabaseAdminClient();
  const payload = parsed.data;
  const currentUser = await getCurrentUser();
  const before =
    payload.id
      ? (
          await supabase
            .from("financiers")
            .select("*")
            .eq("id", payload.id)
            .maybeSingle()
        ).data
      : null;

  const { data: conflicts, error: conflictsError } = await supabase
    .from("financiers")
    .select("id, name")
    .is("deleted_at", null);

  if (conflictsError) {
    return fail(conflictsError.message);
  }

  const duplicate = conflicts?.find(
    (financier) =>
      financier.name.trim().toLowerCase() === payload.name.toLowerCase() &&
      financier.id !== payload.id,
  );

  if (duplicate) {
    return fail("Financier name must be unique.");
  }

  const operation = payload.id
    ? supabase
        .from("financiers")
        .update({
          name: payload.name,
          is_active: payload.is_active,
        })
        .eq("id", payload.id)
    : supabase.from("financiers").insert({
        name: payload.name,
        is_active: payload.is_active,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  const { data: after } = payload.id
    ? await supabase.from("financiers").select("*").eq("id", payload.id).single()
    : await supabase
        .from("financiers")
        .select("*")
        .eq("name", payload.name)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "financiers",
    entityId: after?.id ? String(after.id) : payload.id ?? null,
    action: payload.id ? "financier_updated" : "financier_created",
    before: before as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: { module: "masters" },
  });

  revalidatePath("/financiers");
  revalidatePath("/dealers");
  revalidatePath("/imports");

  return {
    success: true,
    message: payload.id ? "Financier updated." : "Financier created.",
    error: null,
  };
}

export async function saveFinancierAlias(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = aliasSchema.safeParse({
    id: formData.get("id") || undefined,
    financier_id: formData.get("financier_id"),
    alias: formData.get("alias"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid alias form.");
  }

  const supabase = createSupabaseAdminClient();
  const normalized = normalizeAlias(parsed.data.alias);
  const currentUser = await getCurrentUser();
  const before =
    parsed.data.id
      ? (
          await supabase
            .from("financier_aliases")
            .select("*")
            .eq("id", parsed.data.id)
            .maybeSingle()
        ).data
      : null;

  const { data: existing, error: existingError } = await supabase
    .from("financier_aliases")
    .select("id, normalized_alias")
    .is("deleted_at", null);

  if (existingError) {
    return fail(existingError.message);
  }

  const duplicate = existing?.find(
    (alias) => alias.normalized_alias === normalized && alias.id !== parsed.data.id,
  );

  if (duplicate) {
    return fail("This normalized alias is already assigned to another financier.");
  }

  const operation = parsed.data.id
    ? supabase
        .from("financier_aliases")
        .update({
          financier_id: parsed.data.financier_id,
          alias: parsed.data.alias.trim(),
          normalized_alias: normalized,
        })
        .eq("id", parsed.data.id)
    : supabase.from("financier_aliases").insert({
        financier_id: parsed.data.financier_id,
        alias: parsed.data.alias.trim(),
        normalized_alias: normalized,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  const { data: after } = parsed.data.id
    ? await supabase
        .from("financier_aliases")
        .select("*")
        .eq("id", parsed.data.id)
        .single()
    : await supabase
        .from("financier_aliases")
        .select("*")
        .eq("financier_id", parsed.data.financier_id)
        .eq("normalized_alias", normalized)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "financier_aliases",
    entityId: after?.id ? String(after.id) : parsed.data.id ?? null,
    action: parsed.data.id ? "financier_alias_updated" : "financier_alias_created",
    before: before as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: { module: "masters", normalizedAlias: normalized },
  });

  revalidatePath("/financiers");
  revalidatePath("/imports");

  return {
    success: true,
    message: parsed.data.id ? "Alias updated." : "Alias created.",
    error: null,
  };
}

export async function archiveFinancierAlias(aliasId: string) {
  await requireAdminAccess();
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();
  const { data: before } = await supabase
    .from("financier_aliases")
    .select("*")
    .eq("id", aliasId)
    .maybeSingle();
  const { error } = await supabase
    .from("financier_aliases")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", aliasId);

  if (error) {
    throw new Error(error.message);
  }

  const { data: after } = await supabase
    .from("financier_aliases")
    .select("*")
    .eq("id", aliasId)
    .maybeSingle();

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "financier_aliases",
    entityId: aliasId,
    action: "financier_alias_archived",
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
    metadata: { module: "masters" },
  });
  revalidatePath("/financiers");
}
