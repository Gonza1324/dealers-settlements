import Link from "next/link";
import type { ExpenseCategoryRecord, ExpenseFilters } from "@/features/expenses/types";

export function ExpensesFilters({
  categories,
  dealers,
  filters,
}: {
  categories: ExpenseCategoryRecord[];
  dealers: Array<{ id: string; name: string; code: number }>;
  filters: ExpenseFilters;
}) {
  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <form className="masters-form">
        <div className="grid four">
          <label className="field">
            <span>Period month</span>
            <input defaultValue={filters.periodMonth} name="periodMonth" type="month" />
          </label>
          <label className="field">
            <span>Category</span>
            <select defaultValue={filters.categoryId} name="categoryId">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
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
          <label className="field">
            <span>Scope</span>
            <select defaultValue={filters.scopeType} name="scopeType">
              <option value="">All scopes</option>
              <option value="single_dealer">Single dealer</option>
              <option value="selected_dealers">Selected dealers</option>
              <option value="all_dealers">All dealers</option>
            </select>
          </label>
        </div>
        <div className="table-actions">
          <button className="action-button" type="submit">
            Apply filters
          </button>
          <Link className="ghost-button" href="/expenses">
            Reset
          </Link>
        </div>
      </form>
    </section>
  );
}
