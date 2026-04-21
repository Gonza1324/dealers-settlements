import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedProfile } from "@/lib/auth/profile";

export default async function DashboardPage() {
  const profile = await requireAuthenticatedProfile();

  return (
    <>
      <PageHeader
        eyebrow="Internal App"
        title="Dashboard shell"
        description="The backoffice is now connected to Supabase auth, role-aware navigation and protected routes. This dashboard is the first authenticated landing area."
      />

      <section className="grid two">
        <article className="stat-card">
          <p className="eyebrow">Signed in</p>
          <h2 style={{ marginTop: 0 }}>{profile.fullName}</h2>
          <p className="muted">
            Role: {profile.role}
          </p>
        </article>

        <article className="stat-card">
          <p className="eyebrow">App status</p>
          <h2 style={{ marginTop: 0 }}>Auth foundation completed</h2>
          <p className="muted">
            Session handling, profile loading, route protection and role guards
            are ready for the business modules.
          </p>
        </article>
      </section>
    </>
  );
}
