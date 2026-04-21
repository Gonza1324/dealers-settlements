import { PageHeader } from "@/components/ui/page-header";
import { requireAdminAccess } from "@/lib/auth/guards";

export default async function SettingsPage() {
  await requireAdminAccess();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Admin settings"
        description="Reserved for admin-only configuration and operational controls that are still outside the master-data CRUD implemented in this phase."
      />
      <section className="panel">
        <p className="muted" style={{ margin: 0 }}>
          This placeholder confirms that admin-only navigation and route
          protection are working.
        </p>
      </section>
    </>
  );
}
