import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentProfile } from "@/lib/auth/profile";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="page">
      <section className="hero-card login-card">
        <p className="eyebrow">Authentication</p>
        <h1 className="title">Sign in</h1>
        <p className="subtitle">
          Access the internal backoffice with your email and password. Roles
          and navigation are resolved from the `profiles` table after sign-in.
        </p>
        <LoginForm redirectTo={params.redirectTo} />
        {params.error === "profile" && (
          <p className="error-text" style={{ marginTop: 12 }}>
            Your user exists, but no active profile was found.
          </p>
        )}
      </section>
    </main>
  );
}
