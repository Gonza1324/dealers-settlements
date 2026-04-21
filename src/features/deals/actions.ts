"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-session";
import { dealManualCreateSchema, dealManualEditSchema } from "@/features/deals/schema";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

function buildManualDealPayload(params: {
  dealerId: string;
  financierId: string;
  periodMonth: string;
  yearValue: number | null;
  makeValue: string;
  modelValue: string;
  vinValue: string;
  saleValue: string;
  netGrossValue: number;
  pickupValue: number | null;
}) {
  return {
    dealerId: params.dealerId,
    financierId: params.financierId || null,
    periodMonth: params.periodMonth,
    sourceFileId: null,
    sourceRowId: null,
    sourceRowNumber: null,
    yearValue: params.yearValue,
    makeValue: params.makeValue,
    modelValue: params.modelValue,
    vinValue: params.vinValue,
    saleValue: params.saleValue,
    netGrossValue: Number(params.netGrossValue.toFixed(2)),
    pickupValue: Number((params.pickupValue ?? 0).toFixed(2)),
    financeRaw: null,
    financeNormalized: null,
    sourceType: "manual",
  };
}

export async function createManualDeal(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = dealManualCreateSchema.safeParse({
    dealerId: formData.get("dealerId"),
    financierId: formData.get("financierId"),
    periodMonth: formData.get("periodMonth"),
    yearValue: formData.get("yearValue"),
    makeValue: formData.get("makeValue"),
    modelValue: formData.get("modelValue"),
    vinValue: formData.get("vinValue"),
    saleValue: formData.get("saleValue"),
    netGrossValue: formData.get("netGrossValue"),
    pickupValue: formData.get("pickupValue"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid deal form.");
  }

  const payload = parsed.data;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return fail("Unauthorized.");
  }

  const supabase = createSupabaseAdminClient();
  const dealPayload = buildManualDealPayload(payload);
  const { data, error } = await supabase
    .from("deals")
    .insert({
      dealer_id: payload.dealerId,
      financier_id: payload.financierId || null,
      period_month: payload.periodMonth,
      source_file_id: null,
      source_row_id: null,
      source_row_number: null,
      year_value: payload.yearValue,
      make_value: payload.makeValue,
      model_value: payload.modelValue,
      vin_value: payload.vinValue,
      sale_value: payload.saleValue,
      net_gross_value: Number(payload.netGrossValue.toFixed(2)),
      pickup_value: Number((payload.pickupValue ?? 0).toFixed(2)),
      original_payload: dealPayload,
      current_payload: dealPayload,
      created_by: currentUser.id,
      updated_by: currentUser.id,
      is_manually_edited: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail(error?.message ?? "Failed to create deal.");
  }

  revalidatePath("/deals");
  redirect(`/deals/${data.id}`);
}

export async function saveDealManualEdit(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = dealManualEditSchema.safeParse({
    id: formData.get("id"),
    dealerId: formData.get("dealerId"),
    financierId: formData.get("financierId"),
    periodMonth: formData.get("periodMonth"),
    yearValue: formData.get("yearValue"),
    makeValue: formData.get("makeValue"),
    modelValue: formData.get("modelValue"),
    vinValue: formData.get("vinValue"),
    saleValue: formData.get("saleValue"),
    netGrossValue: formData.get("netGrossValue"),
    pickupValue: formData.get("pickupValue"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid deal form.");
  }

  const payload = parsed.data;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return fail("Unauthorized.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("update_deal_manually", {
    p_deal_id: payload.id,
    p_actor_user_id: currentUser.id,
    p_dealer_id: payload.dealerId,
    p_financier_id: payload.financierId || null,
    p_period_month: payload.periodMonth,
    p_year_value: payload.yearValue,
    p_make_value: payload.makeValue,
    p_model_value: payload.modelValue,
    p_vin_value: payload.vinValue,
    p_sale_value: payload.saleValue,
    p_net_gross_value: payload.netGrossValue,
    p_pickup_value: payload.pickupValue ?? 0,
  });

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${payload.id}`);

  return {
    success: true,
    message: "Deal updated.",
    error: null,
  };
}
