"use client";

import { useActionState } from "react";
import { signInWithPassword } from "@/app/(auth)/actions";

const initialState = {
  error: null,
};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(signInWithPassword, initialState);

  return (
    <form action={formAction} className="login-form">
      <input name="redirectTo" type="hidden" value={redirectTo ?? "/dashboard"} />

      <label className="field">
        <span>Email</span>
        <input autoComplete="email" name="email" type="email" />
      </label>

      <label className="field">
        <span>Password</span>
        <input autoComplete="current-password" name="password" type="password" />
      </label>

      <button className="action-button" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      {state.error && <p className="error-text">{state.error}</p>}
    </form>
  );
}
