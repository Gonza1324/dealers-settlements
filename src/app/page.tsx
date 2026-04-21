import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <main className="page">
      <section className="hero-card" style={{ maxWidth: 920 }}>
        <p className="eyebrow">Phase 1</p>
        <h1 className="title">Dealers Settlements</h1>
        <p className="subtitle" style={{ maxWidth: 680 }}>
          Base project initialized with Next.js, TypeScript, feature folders and
          the initial Supabase schema for dealers, imports, expenses and monthly
          settlements.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <Link className="badge" href="/login">
            Open login
          </Link>
        </div>
      </section>
    </main>
  );
}
