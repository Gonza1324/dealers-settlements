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
  const activeFilters = [
    filters.periodMonth && `Period ${filters.periodMonth}`,
    filters.dealerId && "Dealer filtered",
    filters.financierId && "Financier filtered",
    filters.paymentStatus && `Payment ${filters.paymentStatus}`,
  ].filter(Boolean);

  return (
    <section className="panel filter-panel">
      <div className="filter-panel-header">
        <div>
          <p className="eyebrow">Dashboard filters</p>
          <h2>Refine the visible business picture</h2>
          <p>Use month, dealer, financier and payout status to focus the dashboard.</p>
        </div>
        <div className="filter-summary">
          {activeFilters.length > 0 ? `${activeFilters.length} active filters` : "Showing default scope"}
        </div>
      </div>
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
        <div className="filter-panel-actions">
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
