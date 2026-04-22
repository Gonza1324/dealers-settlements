"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import {
  requireSettlementManagerAccess,
} from "@/lib/auth/guards";
import { runMonthlyCalculationSchema, settlementPayoutSchema } from "@/features/settlements/schema";
import { runMonthlyCalculation } from "@/features/settlements/engine";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";
import {
  removeSettlementAttachment,
  uploadSettlementAttachment,
} from "@/features/settlements/storage";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

export async function executeMonthlyCalculation(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireSettlementManagerAccess();

  const parsed = runMonthlyCalculationSchema.safeParse({
    periodMonth: formData.get("periodMonth"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid calculation request.");
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return fail("Unauthorized.");
  }

  try {
    const result = await runMonthlyCalculation({
      periodMonth: parsed.data.periodMonth,
      actorUserId: currentUser.id,
      notes: parsed.data.notes,
    });

    await writeAuditLog({
      actorUserId: currentUser.id,
      entityTable: "monthly_calculation_runs",
      entityId: result.runId,
      action: "monthly_calculation_executed",
      before: null,
      after: {
        runId: result.runId,
        status: result.status,
        summary: result.summary,
      },
      metadata: {
        module: "settlements",
        periodMonth: parsed.data.periodMonth,
        notes: parsed.data.notes,
      },
    });

    revalidatePath("/settlements");
    revalidatePath(`/settlements/${result.runId}`);

    if (result.status === "failed") {
      return fail("Calculation failed. A failed run was recorded for review.");
    }

    return {
      success: true,
      message:
        result.summary.errorCount > 0
          ? `Calculation finished with ${result.summary.errorCount} validation issue(s). Dealers: ${result.summary.dealersCalculated}, partners: ${result.summary.partnersCalculated}.`
          : `Calculation finished. Dealers: ${result.summary.dealersCalculated}, partners: ${result.summary.partnersCalculated}.`,
      error: null,
    };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Calculation failed.");
  }
}

export async function savePartnerPayout(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireSettlementManagerAccess();

  const parsed = settlementPayoutSchema.safeParse({
    payoutId: formData.get("payoutId"),
    runId: formData.get("runId"),
    paymentStatus: formData.get("paymentStatus"),
    paidAmount: formData.get("paidAmount"),
    paidAt: formData.get("paidAt"),
    paymentMethod: formData.get("paymentMethod") ?? "",
    paymentNote: formData.get("paymentNote") ?? "",
    existingAttachmentPath: formData.get("existingAttachmentPath") ?? "",
    removeAttachment: formData.get("removeAttachment") ?? false,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid payout form.");
  }

  const payload = parsed.data;
  let attachmentPath = payload.existingAttachmentPath || null;
  const incomingAttachment = formData.get("paymentAttachment");
  const attachmentFile =
    incomingAttachment instanceof File && incomingAttachment.size > 0
      ? incomingAttachment
      : null;

  try {
    if (attachmentFile) {
      const buffer = Buffer.from(await attachmentFile.arrayBuffer());
      attachmentPath = await uploadSettlementAttachment({
        filename: attachmentFile.name,
        paidAt: payload.paidAt ?? new Date().toISOString().slice(0, 10),
        fileBuffer: buffer,
        contentType: attachmentFile.type || "application/octet-stream",
      });

      if (payload.existingAttachmentPath) {
        await removeSettlementAttachment(payload.existingAttachmentPath);
      }
    } else if (payload.removeAttachment && payload.existingAttachmentPath) {
      await removeSettlementAttachment(payload.existingAttachmentPath);
      attachmentPath = null;
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Attachment handling failed.");
  }

  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();
  const { data: before } = await supabase
    .from("partner_monthly_payouts")
    .select("*")
    .eq("id", payload.payoutId)
    .maybeSingle();
  const { error } = await supabase
    .from("partner_monthly_payouts")
    .update({
      payment_status: payload.paymentStatus,
      paid_amount: payload.paymentStatus === "paid" ? payload.paidAmount : null,
      paid_at: payload.paymentStatus === "paid" ? payload.paidAt : null,
      payment_method: payload.paymentStatus === "paid" ? payload.paymentMethod || null : null,
      payment_note: payload.paymentStatus === "paid" ? payload.paymentNote || null : null,
      payment_attachment_path:
        payload.paymentStatus === "paid" ? attachmentPath : null,
    })
    .eq("id", payload.payoutId);

  if (error) {
    return fail(error.message);
  }

  const { data: after } = await supabase
    .from("partner_monthly_payouts")
    .select("*")
    .eq("id", payload.payoutId)
    .maybeSingle();

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "partner_monthly_payouts",
    entityId: payload.payoutId,
    action: "payout_status_updated",
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
    metadata: {
      module: "settlements",
      runId: payload.runId,
      paymentStatus: payload.paymentStatus,
    },
  });

  revalidatePath("/settlements");
  if (payload.runId) {
    revalidatePath(`/settlements/${payload.runId}`);
  }

  return {
    success: true,
    message: "Payout updated.",
    error: null,
  };
}
