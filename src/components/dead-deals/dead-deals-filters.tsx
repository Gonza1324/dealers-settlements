import type { DeadDealFilters } from "@/features/dead-deals/types";

export function DeadDealsFilters({
  dealers,
  financiers,
  filters,
}: {
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<{ id: string; name: string }>;
  filters: DeadDealFilters;
}) {
  const activeFilters = [
    filters.periodMonth && `Period ${filters.periodMonth}`,
    filters.dealerId && "Dealer",
    filters.financierId && "Financier",
    filters.vin && "VIN",
  ].filter(Boolean);

  return (
    <section className="panel filter-panel">
      <div className="filter-panel-header">
        <div>
          <p className="eyebrow">Dead deals filters</p>
          <h2>Narrow down manual dead deal records</h2>
          <p>Review the manual registry by month, dealer, financier and VIN.</p>
        </div>
        <div className="filter-summary">
          {activeFilters.length > 0 ? `${activeFilters.length} active filters` : "Showing all dead deals"}
        </div>
      </div>
      <form className="filter-form-grid compact" method="get">
        <label className="field compact">
          <span>Period month</span>
          <input defaultValue={filters.periodMonth} name="periodMonth" type="month" />
        </label>
        <label className="field compact">
          <span>Dealer</span>
          <select defaultValue={filters.dealerId} name="dealerId">
            <option value="">All dealers</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name} ({dealer.code})
              </option>
            ))}
          </select>
        </label>
        <label className="field compact">
          <span>Financier</span>
          <select defaultValue={filters.financierId} name="financierId">
            <option value="">All financiers</option>
            {financiers.map((financier) => (
              <option key={financier.id} value={financier.id}>
                {financier.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field compact">
          <span>VIN</span>
          <input defaultValue={filters.vin} name="vin" placeholder="Search VIN" />
        </label>
        <div className="filter-panel-actions">
          <button className="action-button" type="submit">
            Apply filters
          </button>
          <a className="ghost-button" href="/dead-deals">
            Reset
          </a>
        </div>
      </form>
    </section>
  );
}
