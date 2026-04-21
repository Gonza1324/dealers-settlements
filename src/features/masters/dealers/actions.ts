"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assignmentSchema, dealerSchema, shareSchema } from "@/features/masters/dealers/schema";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";
import { overlaps } from "@/features/masters/shared/utils";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

export async function saveDealer(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = dealerSchema.safeParse({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    name: formData.get("name"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid dealer form.");
  }

  const supabase = createSupabaseAdminClient();
  const payload = parsed.data;

  const { data: conflicts, error: conflictError } = await supabase
    .from("dealers")
    .select("id, code, name")
    .is("deleted_at", null);

  if (conflictError) {
    return fail(conflictError.message);
  }

  const duplicateCode = conflicts?.find(
    (dealer) => dealer.code === payload.code && dealer.id !== payload.id,
  );
  const duplicateName = conflicts?.find(
    (dealer) =>
      dealer.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
      dealer.id !== payload.id,
  );

  if (duplicateCode) {
    return fail("Dealer code must be unique.");
  }

  if (duplicateName) {
    return fail("Dealer name must be unique.");
  }

  const operation = payload.id
    ? supabase
        .from("dealers")
        .update({
          code: payload.code,
          name: payload.name.trim(),
          status: payload.status,
        })
        .eq("id", payload.id)
    : supabase.from("dealers").insert({
        code: payload.code,
        name: payload.name.trim(),
        status: payload.status,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/dealers");

  return {
    success: true,
    message: payload.id ? "Dealer updated." : "Dealer created.",
    error: null,
  };
}

export async function archiveDealer(dealerId: string) {
  await requireAdminAccess();
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("dealers")
    .update({
      deleted_at: new Date().toISOString(),
      status: "archived",
    })
    .eq("id", dealerId);

  revalidatePath("/dealers");
}

export async function saveShare(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = shareSchema.safeParse({
    id: formData.get("id") || undefined,
    dealer_id: formData.get("dealer_id"),
    partner_id: formData.get("partner_id"),
    share_percentage: formData.get("share_percentage"),
    valid_from: formData.get("valid_from"),
    valid_to: formData.get("valid_to") || null,
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid share form.");
  }

  const supabase = createSupabaseAdminClient();
  const payload = parsed.data;

  const { data: existingShares, error: existingError } = await supabase
    .from("dealer_partner_shares")
    .select("*")
    .eq("dealer_id", payload.dealer_id)
    .is("deleted_at", null);

  if (existingError) {
    return fail(existingError.message);
  }

  const overlappingTotal = (existingShares ?? [])
    .filter((share) => share.id !== payload.id)
    .filter((share) =>
      overlaps({
        startA: payload.valid_from,
        endA: payload.valid_to ?? null,
        startB: share.valid_from,
        endB: share.valid_to,
      }),
    )
    .reduce((total, share) => total + Number(share.share_percentage), 0);

  if (overlappingTotal + payload.share_percentage > 100) {
    return fail(
      "The total overlapping share percentage for this dealer cannot exceed 100%.",
    );
  }

  const operation = payload.id
    ? supabase
        .from("dealer_partner_shares")
        .update({
          dealer_id: payload.dealer_id,
          partner_id: payload.partner_id,
          share_percentage: payload.share_percentage,
          valid_from: payload.valid_from,
          valid_to: payload.valid_to,
          notes: payload.notes,
        })
        .eq("id", payload.id)
    : supabase.from("dealer_partner_shares").insert({
        dealer_id: payload.dealer_id,
        partner_id: payload.partner_id,
        share_percentage: payload.share_percentage,
        valid_from: payload.valid_from,
        valid_to: payload.valid_to,
        notes: payload.notes,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/dealers");

  return {
    success: true,
    message: payload.id ? "Share updated." : "Share created.",
    error: null,
  };
}

export async function archiveShare(shareId: string) {
  await requireAdminAccess();
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("dealer_partner_shares")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", shareId);

  revalidatePath("/dealers");
}

export async function saveAssignment(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdminAccess();

  const parsed = assignmentSchema.safeParse({
    id: formData.get("id") || undefined,
    dealer_id: formData.get("dealer_id"),
    financier_id: formData.get("financier_id"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date") || null,
    financial_notes: formData.get("financial_notes") || null,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid assignment form.");
  }

  const supabase = createSupabaseAdminClient();
  const payload = parsed.data;

  const { data: existingAssignments, error: existingError } = await supabase
    .from("dealer_financier_assignments")
    .select("*")
    .eq("financier_id", payload.financier_id)
    .is("deleted_at", null);

  if (existingError) {
    return fail(existingError.message);
  }

  const overlap = (existingAssignments ?? [])
    .filter((assignment) => assignment.id !== payload.id)
    .some((assignment) =>
      overlaps({
        startA: payload.start_date,
        endA: payload.end_date ?? null,
        startB: assignment.start_date,
        endB: assignment.end_date,
      }),
    );

  if (overlap) {
    return fail(
      "This financier already has an overlapping dealer assignment for the selected date range.",
    );
  }

  const operation = payload.id
    ? supabase
        .from("dealer_financier_assignments")
        .update({
          dealer_id: payload.dealer_id,
          financier_id: payload.financier_id,
          start_date: payload.start_date,
          end_date: payload.end_date,
          financial_notes: payload.financial_notes,
        })
        .eq("id", payload.id)
    : supabase.from("dealer_financier_assignments").insert({
        dealer_id: payload.dealer_id,
        financier_id: payload.financier_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        financial_notes: payload.financial_notes,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/dealers");

  return {
    success: true,
    message: payload.id ? "Assignment updated." : "Assignment created.",
    error: null,
  };
}

export async function archiveAssignment(assignmentId: string) {
  await requireAdminAccess();
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("dealer_financier_assignments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assignmentId);

  revalidatePath("/dealers");
}
