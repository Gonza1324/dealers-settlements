import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function recordImportReviewActions(params: {
  rowId: string;
  editedBy: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const fields = Object.keys(params.after) as Array<keyof typeof params.after>;
  const changedFields = fields.filter((field) => {
    const beforeValue = params.before[field];
    const afterValue = params.after[field];

    return JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
  });

  if (changedFields.length === 0) {
    return;
  }

  const records = changedFields.map((field) => ({
    raw_row_id: params.rowId,
    field_name: String(field),
    old_value:
      params.before[field] === undefined ? null : (params.before[field] as never),
    new_value:
      params.after[field] === undefined ? null : (params.after[field] as never),
    edited_by: params.editedBy,
  }));

  const { error } = await supabase.from("import_review_actions").insert(records);

  if (error) {
    throw new Error(`Failed to record import review actions: ${error.message}`);
  }
}
