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
  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <form className="imports-filters" method="get">
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
        <div className="table-actions">
          <button className="secondary-button" type="submit">
            Apply filters
          </button>
        </div>
      </form>
    </section>
  );
}
