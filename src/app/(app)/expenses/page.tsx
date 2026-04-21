import { PageHeader } from "@/components/ui/page-header";
import { requireExpenseAccess } from "@/lib/auth/guards";

export default async function ExpensesPage() {
  const profile = await requireExpenseAccess();

  return (
    <>
      <PageHeader
        eyebrow="Expenses"
        title="Expenses module"
        description="This area is already protected for super admins and expense admins, so the expense workflows can be implemented without revisiting auth structure."
      />
      <section className="grid two">
        <article className="stat-card">
          <p className="eyebrow">Signed in as</p>
          <h2 style={{ marginTop: 0 }}>{profile.fullName}</h2>
          <p className="muted">Role: {profile.role}</p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Planned next</p>
          <h2 style={{ marginTop: 0 }}>Expense CRUD and allocations</h2>
          <p className="muted">
            The route guard is already in place for the correct roles.
          </p>
        </article>
      </section>
    </>
  );
}
