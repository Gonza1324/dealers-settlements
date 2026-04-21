import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getSession = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();

  return session?.user ?? null;
});
