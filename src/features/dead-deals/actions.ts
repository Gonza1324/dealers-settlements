"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deadDealDeleteSchema, deadDealSchema } from "@/features/dead-deals/schema";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";
import { requireDeadDealManagerAccess } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/get-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

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
  const before =
    payload.id
      ? (
          await supabase
            .from("dead_deals")
            .select("*")
            .eq("id", payload.id)
            .maybeSingle()
        ).data
      : null;
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

  const { data: after } = payload.id
    ? await supabase.from("dead_deals").select("*").eq("id", payload.id).single()
    : await supabase
        .from("dead_deals")
        .select("*")
        .eq("dealer_id", payload.dealerId)
        .eq("vin_value", payload.vinValue)
        .eq("dead_deal_date", payload.deadDealDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

  await writeAuditLog({
    actorUserId: currentUser.id,
    entityTable: "dead_deals",
    entityId: after?.id ? String(after.id) : payload.id ?? null,
    action: payload.id ? "dead_deal_updated" : "dead_deal_created",
    before: before as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: { module: "dead_deals" },
  });

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
  const { data: before } = await supabase
    .from("dead_deals")
    .select("*")
    .eq("id", parsed.data.deadDealId)
    .maybeSingle();
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

  const { data: after } = await supabase
    .from("dead_deals")
    .select("*")
    .eq("id", parsed.data.deadDealId)
    .maybeSingle();

  await writeAuditLog({
    actorUserId: currentUser.id,
    entityTable: "dead_deals",
    entityId: parsed.data.deadDealId,
    action: "dead_deal_archived",
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
    metadata: { module: "dead_deals" },
  });

  revalidatePath("/dead-deals");
  revalidatePath(`/dead-deals/${parsed.data.deadDealId}`);
  revalidatePath("/settlements");
  redirect("/dead-deals");
}
