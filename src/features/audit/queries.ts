import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AuditFilters, AuditLogRecord, AuditPageData } from "@/features/audit/types";

function parseRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export async function getAuditPageData(
  filters: AuditFilters,
): Promise<AuditPageData> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("audit_logs")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.entityTable) {
    query = query.eq("entity_table", filters.entityTable);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load audit logs: ${error.message}`);
  }

  const logs = ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = row.profiles as { full_name?: string; email?: string } | null;
    const actorDisplay =
      typeof profile?.full_name === "string" && profile.full_name
        ? profile.full_name
        : typeof profile?.email === "string" && profile.email
          ? profile.email
          : "System";

    return {
      id: String(row.id),
      actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
      actorDisplay,
      entityTable: String(row.entity_table ?? ""),
      entityId: row.entity_id ? String(row.entity_id) : null,
      action: String(row.action ?? ""),
      beforeJson: parseRecord(row.before_json),
      afterJson: parseRecord(row.after_json),
      metadata: parseRecord(row.metadata),
      createdAt: String(row.created_at ?? ""),
    } satisfies AuditLogRecord;
  });

  return {
    logs,
    filters,
    entityTables: [...new Set(logs.map((log) => log.entityTable))].sort(),
    actions: [...new Set(logs.map((log) => log.action))].sort(),
  };
}
