export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  importBucketName:
    process.env.SUPABASE_IMPORT_BUCKET?.trim() || "import-files",
  expenseAttachmentBucketName:
    process.env.SUPABASE_EXPENSE_ATTACHMENT_BUCKET?.trim() ||
    "expense-attachments",
  settlementAttachmentBucketName:
    process.env.SUPABASE_SETTLEMENT_ATTACHMENT_BUCKET?.trim() ||
    "settlement-payment-attachments",
};

export function hasSupabasePublicEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function requireSupabasePublicEnv() {
  if (!env.supabaseUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!env.supabaseAnonKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
  };
}

export function requireSupabaseAdminEnv() {
  const publicEnv = requireSupabasePublicEnv();

  if (!env.supabaseServiceRoleKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return {
    ...publicEnv,
    supabaseServiceRoleKey: env.supabaseServiceRoleKey,
  };
}
