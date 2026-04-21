function getEnv(name: string) {
  return process.env[name] ?? "";
}

export const env = {
  supabaseUrl: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  importBucketName: getEnv("SUPABASE_IMPORT_BUCKET") ?? "import-files",
  expenseAttachmentBucketName:
    getEnv("SUPABASE_EXPENSE_ATTACHMENT_BUCKET") ?? "expense-attachments",
  settlementAttachmentBucketName:
    getEnv("SUPABASE_SETTLEMENT_ATTACHMENT_BUCKET") ??
    "settlement-payment-attachments",
};

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function requireSupabaseEnv() {
  if (!env.supabaseUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!env.supabaseAnonKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (!env.supabaseServiceRoleKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    supabaseServiceRoleKey: env.supabaseServiceRoleKey,
  };
}
