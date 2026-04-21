import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();
  const writableCookieStore = cookieStore as unknown as {
    set?: (name: string, value: string, options?: Record<string, unknown>) => void;
  };

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            writableCookieStore.set?.(name, value, options);
          });
        } catch {
          // Server Components can read cookies but cannot mutate them.
          // Middleware and Route Handlers handle persistence when writes are allowed.
        }
      },
    },
  });
}
