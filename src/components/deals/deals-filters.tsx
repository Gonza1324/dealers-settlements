import type { DealFilters } from "@/features/deals/types";

export function DealsFilters({
  dealers,
  financiers,
  filters,
}: {
  dealers: Array<{ dealer_id: string; dealer_name: string; dealer_code: number }>;
  financiers: Array<{ id: string; name: string }>;
  filters: DealFilters;
}) {
  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <form className="masters-form">
        <label className="field">
          <span>Period month</span>
          <input defaultValue={filters.periodMonth} name="periodMonth" type="date" />
        </label>
        <label className="field">
          <span>Dealer</span>
          <select defaultValue={filters.dealerId} name="dealerId">
            <option value="">All dealers</option>
            {dealers.map((dealer) => (
              <option key={dealer.dealer_id} value={dealer.dealer_id}>
                {dealer.dealer_name} ({dealer.dealer_code})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
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
        <label className="field">
          <span>VIN</span>
          <input defaultValue={filters.vin} name="vin" />
        </label>
        <label className="field">
          <span>Make</span>
          <input defaultValue={filters.make} name="make" />
        </label>
        <label className="field">
          <span>Model</span>
          <input defaultValue={filters.model} name="model" />
        </label>
        <label className="field">
          <span>Manual edit</span>
          <select defaultValue={filters.isManuallyEdited} name="isManuallyEdited">
            <option value="all">All</option>
            <option value="yes">Edited only</option>
            <option value="no">Original only</option>
          </select>
        </label>
        <input name="page" type="hidden" value="1" />
        <button className="action-button" type="submit">
          Apply filters
        </button>
      </form>
    </section>
  );
}
