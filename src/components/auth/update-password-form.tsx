"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      setIsReady(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(Boolean(session));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsPending(true);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setIsPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated. You can sign in with the new password.");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>New password</span>
        <input
          autoComplete="new-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      <label className="field">
        <span>Confirm password</span>
        <input
          autoComplete="new-password"
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          value={confirmPassword}
        />
      </label>

      {!isReady && (
        <p className="warning-text">
          Open this page from the password recovery email so Supabase can start the
          recovery session.
        </p>
      )}

      <button className="action-button" disabled={isPending || !isReady} type="submit">
        {isPending ? "Updating..." : "Update password"}
      </button>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}
    </form>
  );
}
