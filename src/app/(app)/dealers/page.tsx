import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/guards";

export default async function DealersPage() {
  const profile = await requireRole(["super_admin", "partner_viewer"]);

  return (
    <>
      <PageHeader
        eyebrow="Dealers"
        title="Dealers workspace"
        description="This module is ready for dealer lists, memberships and dealer-level visibility. For now it serves as a protected placeholder inside the authenticated backoffice."
      />
      <section className="grid two">
        <article className="stat-card">
          <p className="eyebrow">Access</p>
          <h2 style={{ marginTop: 0 }}>{profile.role}</h2>
          <p className="muted">
            Partner viewers will eventually be scoped to their participating
            dealers.
          </p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Next build</p>
          <h2 style={{ marginTop: 0 }}>Dealer CRUD and memberships</h2>
          <p className="muted">
            The auth and routing foundation is ready for those flows.
          </p>
        </article>
      </section>
    </>
  );
}
