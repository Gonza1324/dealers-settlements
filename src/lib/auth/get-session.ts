import { cache } from "react";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getSession = cache(async () => {
  if (!hasSupabasePublicEnv()) {
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
