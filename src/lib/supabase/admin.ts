import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = requireSupabaseEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
