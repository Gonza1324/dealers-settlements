import Link from "next/link";
import { AdminDashboardSection } from "@/components/dashboard/admin-dashboard-section";
import { DashboardFiltersForm } from "@/components/dashboard/dashboard-filters";
import { PartnerDashboardSection } from "@/components/dashboard/partner-dashboard-section";
import { PageHeader } from "@/components/ui/page-header";
import { parseDashboardFilters } from "@/features/dashboard/filters";
import { getDashboardPageData } from "@/features/dashboard/queries";
import { requireAuthenticatedProfile } from "@/lib/auth/profile";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireAuthenticatedProfile();
  const filters = parseDashboardFilters(await searchParams);

  if (profile.role === "expense_admin") {
    return (
      <>
        <PageHeader
          eyebrow="Operations dashboard"
          title="Expenses workspace"
          description="Expense managers do not need the executive dashboard in this phase. Use the expense module to manage recurring templates, categories, attachments and dealer allocations."
        />
        <section className="grid two">
          <article className="stat-card">
            <p className="eyebrow">Current role</p>
            <h2 style={{ marginTop: 0 }}>{profile.fullName}</h2>
            <p className="muted" style={{ marginBottom: 0 }}>
              Expense admin access is focused on operational spend management.
            </p>
          </article>
          <article className="stat-card">
            <p className="eyebrow">Quick access</p>
            <h2 style={{ marginTop: 0 }}>Expense operations</h2>
            <p className="muted">Open the modules you use most often.</p>
            <div className="table-actions">
              <Link className="action-button" href="/expenses">
                Open expenses
              </Link>
              <Link className="ghost-button" href="/dead-deals">
                Open dead deals
              </Link>
            </div>
          </article>
        </section>
      </>
    );
  }

  const data = await getDashboardPageData({
    filters,
    profileId: profile.id,
    role: profile.role,
  });

  return (
    <>
      <PageHeader
        eyebrow="Operations dashboard"
        title={
          profile.role === "super_admin"
            ? "Business overview"
            : "Partner overview"
        }
        description={
          profile.role === "super_admin"
            ? "Track monthly net profit, payout exposure, dealer performance, top financiers and the latest settlement-ready picture of the business."
            : "Monitor your dealers, monthly net performance, allocated expenses, payout status and read-only access to the underlying operating data."
        }
      />

      <DashboardFiltersForm
        dealers={data.dealerOptions}
        financiers={data.financierOptions}
        filters={data.filters}
      />

      {profile.role === "super_admin" ? (
        <AdminDashboardSection data={data} />
      ) : (
        <PartnerDashboardSection data={data} />
      )}
    </>
  );
}
