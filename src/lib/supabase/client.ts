import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = requireSupabasePublicEnv();
    browserClient = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
    );
  }

  return browserClient;
}
