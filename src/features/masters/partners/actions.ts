"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-session";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";
import { partnerSchema } from "@/features/masters/partners/schema";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

export async function savePartner(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = partnerSchema.safeParse({
    id: formData.get("id") || undefined,
    display_name: formData.get("display_name"),
    user_id: formData.get("user_id") || null,
    is_active: formData.get("is_active") || "true",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid partner form.");
  }

  const supabase = createSupabaseAdminClient();
  const payload = parsed.data;
  const currentUser = await getCurrentUser();
  const before =
    payload.id
      ? (
          await supabase
            .from("partners")
            .select("*")
            .eq("id", payload.id)
            .maybeSingle()
        ).data
      : null;

  const operation = payload.id
    ? supabase
        .from("partners")
        .update({
          display_name: payload.display_name,
          user_id: payload.user_id || null,
          is_active: payload.is_active,
        })
        .eq("id", payload.id)
    : supabase.from("partners").insert({
        display_name: payload.display_name,
        user_id: payload.user_id || null,
        is_active: payload.is_active,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  const { data: after } = payload.id
    ? await supabase.from("partners").select("*").eq("id", payload.id).single()
    : await supabase
        .from("partners")
        .select("*")
        .eq("display_name", payload.display_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "partners",
    entityId: after?.id ? String(after.id) : payload.id ?? null,
    action: payload.id ? "partner_updated" : "partner_created",
    before: before as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: { module: "masters" },
  });

  revalidatePath("/partners");
  revalidatePath("/dealers");

  return {
    success: true,
    message: payload.id ? "Partner updated." : "Partner created.",
    error: null,
  };
}
