import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function uploadSettlementAttachment(params: {
  filename: string;
  paidAt: string;
  fileBuffer: Buffer;
  contentType: string;
}) {
  const supabase = createSupabaseAdminClient();
  const storagePath = `${params.paidAt}/${randomUUID()}-${params.filename}`;

  const { error } = await supabase.storage
    .from(env.settlementAttachmentBucketName)
    .upload(storagePath, params.fileBuffer, {
      cacheControl: "3600",
      contentType: params.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Payment attachment upload failed: ${error.message}`);
  }

  return storagePath;
}

export async function removeSettlementAttachment(path: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(env.settlementAttachmentBucketName).remove([path]);
}
