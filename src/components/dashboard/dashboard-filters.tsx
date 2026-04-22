import type { DashboardFilters, DashboardOption } from "@/features/dashboard/types";

export function DashboardFiltersForm({
  filters,
  dealers,
  financiers,
}: {
  filters: DashboardFilters;
  dealers: DashboardOption[];
  financiers: DashboardOption[];
}) {
  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <form action="/dashboard" className="dashboard-filters-form" method="get">
        <label className="field compact">
          <span>Period</span>
          <input defaultValue={filters.periodMonth} name="periodMonth" type="month" />
        </label>
        <label className="field compact">
          <span>Dealer</span>
          <select defaultValue={filters.dealerId} name="dealerId">
            <option value="">All</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field compact">
          <span>Financier</span>
          <select defaultValue={filters.financierId} name="financierId">
            <option value="">All</option>
            {financiers.map((financier) => (
              <option key={financier.id} value={financier.id}>
                {financier.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field compact">
          <span>Payment</span>
          <select defaultValue={filters.paymentStatus} name="paymentStatus">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </label>
        <div className="table-actions">
          <button className="action-button" type="submit">
            Apply filters
          </button>
          <a className="ghost-button" href="/dashboard">
            Reset
          </a>
        </div>
      </form>
    </section>
  );
}
