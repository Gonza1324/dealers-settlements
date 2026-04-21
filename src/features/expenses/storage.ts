import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function uploadExpenseAttachment(params: {
  filename: string;
  expenseDate: string;
  fileBuffer: Buffer;
  contentType: string;
}) {
  const supabase = createSupabaseAdminClient();
  const storagePath = `${params.expenseDate}/${randomUUID()}-${params.filename}`;

  const { error } = await supabase.storage
    .from(env.expenseAttachmentBucketName)
    .upload(storagePath, params.fileBuffer, {
      cacheControl: "3600",
      contentType: params.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Attachment upload failed: ${error.message}`);
  }

  return storagePath;
}

export async function removeExpenseAttachment(path: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(env.expenseAttachmentBucketName).remove([path]);
}
