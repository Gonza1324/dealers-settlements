"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  revalidatePath("/partners");
  revalidatePath("/dealers");

  return {
    success: true,
    message: payload.id ? "Partner updated." : "Partner created.",
    error: null,
  };
}
