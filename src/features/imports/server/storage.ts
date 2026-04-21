import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function uploadImportFileToStorage(params: {
  filename: string;
  sourceMonth: string;
  fileBuffer: Buffer;
  contentType: string;
}) {
  const supabase = createSupabaseAdminClient();
  const storagePath = `${params.sourceMonth}/${randomUUID()}-${params.filename}`;

  const { error } = await supabase.storage
    .from(env.importBucketName)
    .upload(storagePath, params.fileBuffer, {
      cacheControl: "3600",
      contentType: params.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storagePath;
}

