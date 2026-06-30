import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = requireSupabaseAdminEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
