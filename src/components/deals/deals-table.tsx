import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { DealFilters, DealListRecord, DealSortKey } from "@/features/deals/types";

function buildPageHref(filters: DealFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.periodMonth) params.set("periodMonth", filters.periodMonth);
  if (filters.dealerId) params.set("dealerId", filters.dealerId);
  if (filters.financierId) params.set("financierId", filters.financierId);
  if (filters.vin) params.set("vin", filters.vin);
  if (filters.make) params.set("make", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.isManuallyEdited !== "all") {
    params.set("isManuallyEdited", filters.isManuallyEdited);
  }
  params.set("sortBy", filters.sortBy);
  params.set("sortDirection", filters.sortDirection);

  params.set("page", String(page));
  return `/deals?${params.toString()}`;
}

function buildSortHref(filters: DealFilters, sortBy: DealSortKey) {
  const nextDirection =
    filters.sortBy === sortBy && filters.sortDirection === "asc" ? "desc" : "asc";
  const href = new URL(buildPageHref(filters, 1), "https://placeholder.local");
  href.searchParams.set("sortBy", sortBy);
  href.searchParams.set("sortDirection", nextDirection);
  return `${href.pathname}${href.search}`;
}

function sortableHeading(filters: DealFilters, sortBy: DealSortKey, label: string) {
  const isActive = filters.sortBy === sortBy;
  const directionLabel = isActive
    ? filters.sortDirection === "asc"
      ? "ascending"
      : "descending"
    : "not sorted";

  return {
    key: sortBy,
    ariaSort: isActive
      ? filters.sortDirection === "asc"
        ? "ascending"
        : "descending"
      : "none",
    label: (
      <Link
        aria-label={`${label}, ${directionLabel}. Click to sort ${
          isActive && filters.sortDirection === "asc" ? "descending" : "ascending"
        }.`}
        className="table-sort-link"
        href={buildSortHref(filters, sortBy)}
      >
        {label}
        <span aria-hidden="true" className="table-sort-indicator">
          {isActive ? (filters.sortDirection === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </Link>
    ),
  } as const;
}

export function DealsTable({
  deals,
  filters,
  totalCount,
  totalPages,
}: {
  deals: DealListRecord[];
  filters: DealFilters;
  totalCount: number;
  totalPages: number;
}) {
  if (deals.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="No deals match these filters"
          description="Try a different period, dealer or VIN to find consolidated deals."
        />
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="masters-section-header">
        <div>
          <p className="eyebrow">Consolidated deals</p>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>{totalCount} results</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            Commission and deal profit are calculated automatically by the database.
          </p>
        </div>
      </div>

      <DataTable
        columns={[
          sortableHeading(filters, "period", "Period"),
          sortableHeading(filters, "dealer", "Dealer"),
          sortableHeading(filters, "financier", "Financier"),
          { key: "vin", label: "VIN" },
          sortableHeading(filters, "vehicle", "Vehicle"),
          sortableHeading(filters, "saleDate", "Sale date"),
          sortableHeading(filters, "netGross", "Net gross"),
          sortableHeading(filters, "commission", "Commission"),
          sortableHeading(filters, "dealProfit", "Deal profit"),
          { key: "edited", label: "Edited" },
          { key: "actions", label: "Actions" },
        ]}
      >
        {deals.map((deal) => (
          <tr key={deal.id}>
            <td>{deal.period_month}</td>
            <td>
              {deal.dealer_name}
              <div className="muted small-text">Code {deal.dealer_code}</div>
            </td>
            <td>{deal.financier_name ?? "-"}</td>
            <td>{deal.vin_value}</td>
            <td>
              {deal.year_value ?? "-"} {deal.make_value} {deal.model_value}
            </td>
            <td>{deal.sale_value}</td>
            <td>{deal.net_gross_value}</td>
            <td>{deal.commission_amount}</td>
            <td>{deal.deal_profit}</td>
            <td>
              <StatusPill tone={deal.is_manually_edited ? "warning" : "muted"}>
                {deal.is_manually_edited ? "manual" : "original"}
              </StatusPill>
            </td>
            <td>
              <Link className="ghost-button" href={`/deals/${deal.id}`}>
                View detail
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>

      <div className="table-actions" style={{ marginTop: 20 }}>
        <Link
          aria-disabled={filters.page <= 1}
          className="ghost-button"
          href={buildPageHref(filters, Math.max(1, filters.page - 1))}
        >
          Previous
        </Link>
        <span className="muted" style={{ alignSelf: "center" }}>
          Page {filters.page} of {totalPages}
        </span>
        <Link
          aria-disabled={filters.page >= totalPages}
          className="ghost-button"
          href={buildPageHref(filters, Math.min(totalPages, filters.page + 1))}
        >
          Next
        </Link>
      </div>
    </section>
  );
}
