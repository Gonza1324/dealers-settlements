"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginFormState {
  error: string | null;
}

export async function signInWithPassword(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  const destination =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : "/dashboard";

  redirect(destination);
}
