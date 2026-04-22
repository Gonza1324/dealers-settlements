"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type JsonRecord = Record<string, unknown>;

export async function writeAuditLog(params: {
  actorUserId: string | null;
  entityTable: string;
  entityId: string | null;
  action: string;
  before?: JsonRecord | null;
  after?: JsonRecord | null;
  metadata?: JsonRecord | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: params.actorUserId,
    entity_table: params.entityTable,
    entity_id: params.entityId,
    action: params.action,
    before_json: (params.before ?? {}) as never,
    after_json: (params.after ?? {}) as never,
    metadata: (params.metadata ?? {}) as never,
  });

  if (error) {
    throw new Error(`Failed to write audit log: ${error.message}`);
  }
}
