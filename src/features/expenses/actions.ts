"use server";

import { revalidatePath } from "next/cache";
import { buildExpenseAllocations } from "@/features/expenses/allocation";
import {
  expenseCategorySchema,
  expenseDeleteSchema,
  expenseRecurringTemplateSchema,
  expenseSchema,
} from "@/features/expenses/schema";
import { removeExpenseAttachment, uploadExpenseAttachment } from "@/features/expenses/storage";
import { initialFormState, type FormActionState } from "@/features/masters/shared/form-state";
import { requireExpenseManagerAccess } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/get-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import type { ExpenseScopeType } from "@/types/database";

async function fail(message: string): Promise<FormActionState> {
  return { ...initialFormState, error: message };
}

async function loadActiveDealers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dealers")
    .select("id, name, code")
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name");

  if (error) {
    throw new Error(`Failed to load dealers: ${error.message}`);
  }

  return (data ?? []).map((dealer) => ({
    id: String(dealer.id),
    name: String(dealer.name),
    code: Number(dealer.code),
  }));
}

function resolveTargetDealerIds(params: {
  scopeType: ExpenseScopeType;
  singleDealerId: string;
  selectedDealerIds: string[];
  activeDealers: Array<{ id: string; name: string; code: number }>;
}) {
  if (params.scopeType === "single_dealer") {
    return params.activeDealers.filter((dealer) => dealer.id === params.singleDealerId);
  }

  if (params.scopeType === "selected_dealers") {
    const selected = new Set(params.selectedDealerIds);
    return params.activeDealers.filter((dealer) => selected.has(dealer.id));
  }

  return params.activeDealers;
}

export async function saveExpenseCategory(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireExpenseManagerAccess();

  const parsed = expenseCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    isActive: formData.get("isActive") ?? "true",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid category form.");
  }

  const payload = parsed.data;
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();
  const before =
    payload.id
      ? (
          await supabase
            .from("expense_categories")
            .select("*")
            .eq("id", payload.id)
            .maybeSingle()
        ).data
      : null;
  const { data: existing, error: existingError } = await supabase
    .from("expense_categories")
    .select("id, name")
    .is("deleted_at", null);

  if (existingError) {
    return fail(existingError.message);
  }

  const duplicate = existing?.find(
    (category) =>
      category.name.trim().toLowerCase() === payload.name.toLowerCase() &&
      category.id !== payload.id,
  );

  if (duplicate) {
    return fail("Category name must be unique.");
  }

  const operation = payload.id
    ? supabase
        .from("expense_categories")
        .update({
          name: payload.name,
          is_active: payload.isActive,
        })
        .eq("id", payload.id)
    : supabase.from("expense_categories").insert({
        name: payload.name,
        is_active: payload.isActive,
      });

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  const { data: after } = payload.id
    ? await supabase
        .from("expense_categories")
        .select("*")
        .eq("id", payload.id)
        .single()
    : await supabase
        .from("expense_categories")
        .select("*")
        .eq("name", payload.name)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "expense_categories",
    entityId: after?.id ? String(after.id) : payload.id ?? null,
    action: payload.id ? "expense_category_updated" : "expense_category_created",
    before: before as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: { module: "expenses" },
  });

  revalidatePath("/expenses");

  return {
    success: true,
    message: payload.id ? "Category updated." : "Category created.",
    error: null,
  };
}

export async function archiveExpenseCategory(categoryId: string) {
  await requireExpenseManagerAccess();
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();
  const { data: before } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();
  const { error } = await supabase
    .from("expense_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", categoryId);
  if (error) {
    throw new Error(error.message);
  }
  const { data: after } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();
  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "expense_categories",
    entityId: categoryId,
    action: "expense_category_archived",
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
    metadata: { module: "expenses" },
  });
  revalidatePath("/expenses");
}

export async function saveExpenseRecurringTemplate(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireExpenseManagerAccess();

  const parsed = expenseRecurringTemplateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    defaultDescription: formData.get("defaultDescription") ?? "",
    defaultAmount: formData.get("defaultAmount"),
    scopeType: formData.get("scopeType"),
    selectedDealerIds: formData.getAll("selectedDealerIds"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isActive: formData.get("isActive") ?? "true",
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid template form.");
  }

  const payload = parsed.data;
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();
  const before =
    payload.id
      ? (
          await supabase
            .from("expense_recurring_templates")
            .select("*")
            .eq("id", payload.id)
            .maybeSingle()
        ).data
      : null;
  const { data: existing, error: existingError } = await supabase
    .from("expense_recurring_templates")
    .select("id, name")
    .is("deleted_at", null);

  if (existingError) {
    return fail(existingError.message);
  }

  const duplicate = existing?.find(
    (template) =>
      template.name.trim().toLowerCase() === payload.name.toLowerCase() &&
      template.id !== payload.id,
  );

  if (duplicate) {
    return fail("Template name must be unique.");
  }

  const record = {
    name: payload.name,
    category_id: payload.categoryId || null,
    default_description: payload.defaultDescription || null,
    default_amount: payload.defaultAmount,
    scope_type: payload.scopeType,
    selected_dealer_ids: payload.selectedDealerIds,
    start_date: payload.startDate,
    end_date: payload.endDate,
    is_active: payload.isActive,
  };

  const operation = payload.id
    ? supabase
        .from("expense_recurring_templates")
        .update(record)
        .eq("id", payload.id)
    : supabase.from("expense_recurring_templates").insert(record);

  const { error } = await operation;

  if (error) {
    return fail(error.message);
  }

  const { data: after } = payload.id
    ? await supabase
        .from("expense_recurring_templates")
        .select("*")
        .eq("id", payload.id)
        .single()
    : await supabase
        .from("expense_recurring_templates")
        .select("*")
        .eq("name", payload.name)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "expense_recurring_templates",
    entityId: after?.id ? String(after.id) : payload.id ?? null,
    action: payload.id ? "expense_template_updated" : "expense_template_created",
    before: before as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: { module: "expenses" },
  });

  revalidatePath("/expenses");

  return {
    success: true,
    message: payload.id ? "Recurring template updated." : "Recurring template created.",
    error: null,
  };
}

export async function archiveExpenseRecurringTemplate(templateId: string) {
  await requireExpenseManagerAccess();
  const supabase = createSupabaseAdminClient();
  const currentUser = await getCurrentUser();
  const { data: before } = await supabase
    .from("expense_recurring_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  const { error } = await supabase
    .from("expense_recurring_templates")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", templateId);
  if (error) {
    throw new Error(error.message);
  }
  const { data: after } = await supabase
    .from("expense_recurring_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  await writeAuditLog({
    actorUserId: currentUser?.id ?? null,
    entityTable: "expense_recurring_templates",
    entityId: templateId,
    action: "expense_template_archived",
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
    metadata: { module: "expenses" },
  });
  revalidatePath("/expenses");
}

export async function saveExpense(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireExpenseManagerAccess();

  const parsed = expenseSchema.safeParse({
    id: formData.get("id"),
    recurringTemplateId: formData.get("recurringTemplateId"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    periodMonth: formData.get("periodMonth"),
    scopeType: formData.get("scopeType"),
    singleDealerId: formData.get("singleDealerId"),
    selectedDealerIds: formData.getAll("selectedDealerIds"),
    existingAttachmentPath: formData.get("existingAttachmentPath") ?? "",
    removeAttachment: formData.get("removeAttachment") ?? false,
    isRecurringInstance: formData.get("isRecurringInstance") ?? false,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid expense form.");
  }

  const payload = parsed.data;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return fail("Unauthorized.");
  }

  const activeDealers = await loadActiveDealers();
  const targetDealers = resolveTargetDealerIds({
    scopeType: payload.scopeType,
    singleDealerId: payload.singleDealerId,
    selectedDealerIds: payload.selectedDealerIds,
    activeDealers,
  });

  if (targetDealers.length === 0) {
    return fail("The selected scope does not include any active dealers.");
  }

  const allocations = buildExpenseAllocations({
    amount: payload.amount,
    scopeType: payload.scopeType,
    dealers: targetDealers,
  });

  let attachmentPath = payload.existingAttachmentPath || null;
  const incomingAttachment = formData.get("attachment");
  const attachmentFile =
    incomingAttachment instanceof File && incomingAttachment.size > 0
      ? incomingAttachment
      : null;

  try {
    if (attachmentFile) {
      const buffer = Buffer.from(await attachmentFile.arrayBuffer());
      attachmentPath = await uploadExpenseAttachment({
        filename: attachmentFile.name,
        expenseDate: payload.expenseDate,
        fileBuffer: buffer,
        contentType: attachmentFile.type || "application/octet-stream",
      });

      if (payload.existingAttachmentPath) {
        await removeExpenseAttachment(payload.existingAttachmentPath);
      }
    } else if (payload.removeAttachment && payload.existingAttachmentPath) {
      await removeExpenseAttachment(payload.existingAttachmentPath);
      attachmentPath = null;
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Attachment handling failed.");
  }

  const supabase = createSupabaseAdminClient();
  const before =
    payload.id
      ? (
          await supabase
            .from("expenses")
            .select("*")
            .eq("id", payload.id)
            .maybeSingle()
        ).data
      : null;
  const { error } = await supabase.rpc("upsert_expense_with_allocations", {
    p_expense_id: payload.id || null,
    p_actor_user_id: currentUser.id,
    p_category_id: payload.categoryId || null,
    p_recurring_template_id: payload.recurringTemplateId || null,
    p_description: payload.description,
    p_amount: payload.amount,
    p_expense_date: payload.expenseDate,
    p_period_month: payload.periodMonth,
    p_scope_type: payload.scopeType,
    p_selected_dealer_ids: targetDealers.map((dealer) => dealer.id),
    p_attachment_path: attachmentPath,
    p_is_recurring_instance: payload.isRecurringInstance,
    p_allocations: allocations.map((allocation) => ({
      dealerId: allocation.dealerId,
      allocatedAmount: allocation.allocatedAmount,
    })),
  });

  if (error) {
    return fail(error.message);
  }

  const { data: after } = payload.id
    ? await supabase.from("expenses").select("*").eq("id", payload.id).single()
    : await supabase
        .from("expenses")
        .select("*")
        .eq("description", payload.description)
        .eq("expense_date", payload.expenseDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

  await writeAuditLog({
    actorUserId: currentUser.id,
    entityTable: "expenses",
    entityId: after?.id ? String(after.id) : payload.id ?? null,
    action: payload.id ? "expense_updated" : "expense_created",
    before: before as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    metadata: {
      module: "expenses",
      scopeType: payload.scopeType,
      selectedDealerIds: targetDealers.map((dealer) => dealer.id),
    },
  });

  revalidatePath("/expenses");
  if (payload.id) {
    revalidatePath(`/expenses/${payload.id}`);
  }

  return {
    success: true,
    message: payload.id ? "Expense updated." : "Expense created.",
    error: null,
  };
}

export async function archiveExpense(expenseId: string) {
  await requireExpenseManagerAccess();

  const parsed = expenseDeleteSchema.safeParse({ expenseId });
  if (!parsed.success) {
    throw new Error("Invalid expense id.");
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", parsed.data.expenseId)
    .maybeSingle();
  const { error } = await supabase.rpc("soft_delete_expense", {
    p_expense_id: parsed.data.expenseId,
    p_actor_user_id: currentUser.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: after } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", parsed.data.expenseId)
    .maybeSingle();

  await writeAuditLog({
    actorUserId: currentUser.id,
    entityTable: "expenses",
    entityId: parsed.data.expenseId,
    action: "expense_archived",
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
    metadata: { module: "expenses" },
  });

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${expenseId}`);
}
