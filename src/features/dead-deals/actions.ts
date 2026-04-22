"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deadDealDeleteSchema, deadDealSchema } from "@/features/dead-deals/schema";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";
import { requireDeadDealManagerAccess } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/get-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

export async function saveDeadDeal(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireDeadDealManagerAccess();

  const parsed = deadDealSchema.safeParse({
    id: formData.get("id"),
    dealerId: formData.get("dealerId"),
    financierId: formData.get("financierId"),
    deadDealDate: formData.get("deadDealDate"),
    vinValue: formData.get("vinValue"),
    netGrossValue: formData.get("netGrossValue"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid dead deal form.");
  }

  const payload = parsed.data;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return fail("Unauthorized.");
  }

  const supabase = createSupabaseAdminClient();
  const record = {
    dealer_id: payload.dealerId,
    financier_id: payload.financierId,
    dead_deal_date: payload.deadDealDate,
    vin_value: payload.vinValue,
    net_gross_value: Number(payload.netGrossValue.toFixed(2)),
    updated_by: currentUser.id,
  };

  const operation = payload.id
    ? supabase.from("dead_deals").update(record).eq("id", payload.id)
    : supabase.from("dead_deals").insert({
        ...record,
        created_by: currentUser.id,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/dead-deals");
  if (payload.id) {
    revalidatePath(`/dead-deals/${payload.id}`);
  }
  revalidatePath("/settlements");

  return {
    success: true,
    message: payload.id ? "Dead deal updated." : "Dead deal created.",
    error: null,
  };
}

export async function archiveDeadDeal(deadDealId: string) {
  await requireDeadDealManagerAccess();

  const parsed = deadDealDeleteSchema.safeParse({ deadDealId });
  if (!parsed.success) {
    throw new Error("Invalid dead deal id.");
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("dead_deals")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: currentUser.id,
    })
    .eq("id", parsed.data.deadDealId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dead-deals");
  revalidatePath(`/dead-deals/${parsed.data.deadDealId}`);
  revalidatePath("/settlements");
  redirect("/dead-deals");
}
