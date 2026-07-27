"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { PayoutForm } from "@/components/settlements/payout-form";
import type { PartnerMonthlyResultRecord } from "@/features/settlements/types";
import { formatCurrency } from "@/lib/utils/format";

type PartnerResultFilters = {
  dealerId: string;
  partnerId: string;
  periodMonth: string;
};

const emptyFilters: PartnerResultFilters = {
  dealerId: "",
  partnerId: "",
  periodMonth: "",
};

function formatTotalsScope(results: PartnerMonthlyResultRecord[]) {
  const periods = [...new Set(results.map((result) => result.period_month.slice(0, 7)))]
    .sort()
    .reverse();

  if (periods.length === 0) {
    return "for selected filters";
  }

  if (periods.length === 1) {
    return `for period ${periods[0]}`;
  }

  return `across periods ${periods.join(", ")}`;
}

function countActiveFilters(filters: PartnerResultFilters) {
  return [filters.dealerId, filters.partnerId, filters.periodMonth].filter(Boolean).length;
}

export function PartnerResultsTable({
  canEditPayouts,
  results,
}: {
  canEditPayouts: boolean;
  results: PartnerMonthlyResultRecord[];
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<PartnerResultFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<PartnerResultFilters>(emptyFilters);

  const filterOptions = useMemo(() => {
    const dealers = new Map<string, { id: string; label: string }>();
    const partners = new Map<string, { id: string; label: string }>();
    const months = new Map<string, { id: string; label: string }>();

    for (const result of results) {
      dealers.set(result.dealer_id, {
        id: result.dealer_id,
        label: `${result.dealer_name} (${result.dealer_code})`,
      });
      partners.set(result.partner_id, {
        id: result.partner_id,
        label: result.partner_name,
      });
      months.set(result.period_month.slice(0, 7), {
        id: result.period_month.slice(0, 7),
        label: result.period_month.slice(0, 7),
      });
    }

    const byLabel = (left: { label: string }, right: { label: string }) =>
      left.label.localeCompare(right.label, "en", { numeric: true });

    return {
      dealers: [...dealers.values()].sort(byLabel),
      partners: [...partners.values()].sort(byLabel),
      months: [...months.values()].sort((left, right) => right.id.localeCompare(left.id)),
    };
  }, [results]);

  const filteredResults = useMemo(
    () =>
      results.filter((result) => {
        const resultMonth = result.period_month.slice(0, 7);

        return (
          (!appliedFilters.dealerId || result.dealer_id === appliedFilters.dealerId) &&
          (!appliedFilters.partnerId || result.partner_id === appliedFilters.partnerId) &&
          (!appliedFilters.periodMonth || resultMonth === appliedFilters.periodMonth)
        );
      }),
    [appliedFilters, results],
  );
  const activeFilterCount = countActiveFilters(appliedFilters);

  if (results.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="No partner results"
          description="No partner settlement rows are visible for this run and access scope."
        />
      </section>
    );
  }

  const totalsScope = formatTotalsScope(filteredResults);
  const totalAmount = filteredResults.reduce(
    (sum, result) => sum + Number(result.partner_amount),
    0,
  );
  const pendingAmount = filteredResults
    .filter((result) => result.payout_status === "pending")
    .reduce((sum, result) => sum + Number(result.partner_amount), 0);
  const paidAmount = filteredResults
    .filter((result) => result.payout_status === "paid")
    .reduce((sum, result) => sum + Number(result.paid_amount ?? result.partner_amount), 0);

  return (
    <section className="panel">
      <p className="eyebrow">Partner view</p>
      <div className="settlement-results-header">
        <div>
          <h2 style={{ marginTop: 0 }}>Partner monthly results</h2>
          <p className="muted" style={{ margin: 0 }}>
            Totals shown {totalsScope}.
          </p>
          <div className="table-actions" style={{ marginTop: 12 }}>
            <button
              className="ghost-button"
              onClick={() => setFiltersOpen((current) => !current)}
              type="button"
            >
              {filtersOpen ? "Hide filters" : "Filters"}
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
        </div>
        <div className="settlement-results-totals">
          <article>
            <span>Total</span>
            <strong>{formatCurrency(totalAmount)}</strong>
          </article>
          <article>
            <span>Pending</span>
            <strong>{formatCurrency(pendingAmount)}</strong>
          </article>
          <article>
            <span>Paid</span>
            <strong>{formatCurrency(paidAmount)}</strong>
          </article>
        </div>
      </div>
      {filtersOpen && (
        <div className="settlement-results-filter-panel">
          <label className="field compact">
            <span>Dealer</span>
            <select
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  dealerId: event.target.value,
                }))
              }
              value={draftFilters.dealerId}
            >
              <option value="">All dealers</option>
              {filterOptions.dealers.map((dealer) => (
                <option key={dealer.id} value={dealer.id}>
                  {dealer.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field compact">
            <span>Month</span>
            <select
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  periodMonth: event.target.value,
                }))
              }
              value={draftFilters.periodMonth}
            >
              <option value="">All months</option>
              {filterOptions.months.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field compact">
            <span>Partner</span>
            <select
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  partnerId: event.target.value,
                }))
              }
              value={draftFilters.partnerId}
            >
              <option value="">All partners</option>
              {filterOptions.partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.label}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-panel-actions">
            <button
              className="action-button"
              onClick={() => {
                setAppliedFilters(draftFilters);
                setFiltersOpen(false);
              }}
              type="button"
            >
              Apply filters
            </button>
            <button
              className="ghost-button"
              onClick={() => {
                setDraftFilters(emptyFilters);
                setAppliedFilters(emptyFilters);
              }}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      <DataTable
        className="partner-results-table"
        wrapperClassName="registry-table-scroll"
        columns={[
          { key: "dealer", label: "Dealer" },
          { key: "month", label: "Month" },
          { key: "partner", label: "Partner" },
          { key: "share", label: "Share %" },
          { key: "amount", label: "Partner amount" },
          { key: "status", label: "Payment status" },
          { key: "payment", label: "Manage" },
        ]}
      >
        {filteredResults.map((result) => (
          <tr key={result.id}>
            <td>
              {result.dealer_name}
              <div className="small-text muted">Code {result.dealer_code}</div>
            </td>
            <td>{result.period_month.slice(0, 7)}</td>
            <td>
              {result.partner_name}
              <div className="small-text muted">{result.partner_user_email ?? ""}</div>
            </td>
            <td>{result.share_percentage_snapshot}</td>
            <td>{formatCurrency(result.partner_amount)}</td>
            <td>
              <StatusPill tone={result.payout_status === "paid" ? "success" : "warning"}>
                {result.payout_status}
              </StatusPill>
              {result.payment_attachment_url && (
                <div style={{ marginTop: 8 }}>
                  <Link
                    className="ghost-button"
                    href={result.payment_attachment_url}
                    target="_blank"
                  >
                    Attachment
                  </Link>
                </div>
              )}
            </td>
            <td>
              <details className="payout-details">
                <summary className="payout-summary">
                  {canEditPayouts ? "Manage payment" : "View payment"}
                </summary>
                <PayoutForm canEdit={canEditPayouts} result={result} />
              </details>
            </td>
          </tr>
        ))}
        {filteredResults.length === 0 && (
          <tr>
            <td className="muted" colSpan={7}>
              No partner rows match these filters.
            </td>
          </tr>
        )}
      </DataTable>
    </section>
  );
}
