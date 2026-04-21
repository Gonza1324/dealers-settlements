"use client";

import { useMemo, useState } from "react";
import type { ImportRowReview } from "@/features/imports/types";

type FilterMode = "all" | "errors" | "warnings" | "duplicates";

export function ImportReviewTable({ rows }: { rows: ImportRowReview[] }) {
  const [filter, setFilter] = useState<FilterMode>("all");

  const filteredRows = useMemo(() => {
    switch (filter) {
      case "errors":
        return rows.filter((row) => row.validationErrors.length > 0);
      case "warnings":
        return rows.filter((row) => row.warnings.length > 0);
      case "duplicates":
        return rows.filter((row) => row.isDuplicate);
      default:
        return rows;
    }
  }, [filter, rows]);

  return (
    <section className="panel">
      <div className="imports-toolbar">
        <div>
          <p className="eyebrow">Row review</p>
          <h2 style={{ marginTop: 0 }}>Staging rows before consolidation</h2>
        </div>
        <div className="imports-filters">
          {(["all", "errors", "warnings", "duplicates"] as const).map((mode) => (
            <button
              key={mode}
              className={filter === mode ? "filter-chip active" : "filter-chip"}
              onClick={() => setFilter(mode)}
              type="button"
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="imports-table-wrapper">
        <table className="imports-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>VIN</th>
              <th>Sale</th>
              <th>Finance</th>
              <th>Dealer</th>
              <th>Status</th>
              <th>Original</th>
              <th>Normalized</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.rowNumber}</td>
                <td>{String(row.normalizedPayload.vin ?? row.originalPayload.VIN ?? "-")}</td>
                <td>
                  {String(
                    row.normalizedPayload.saleRaw ?? row.originalPayload.Sale ?? "-",
                  )}
                </td>
                <td>
                  {row.detectedFinancierName ??
                    String(row.normalizedPayload.financierAlias ?? "-")}
                </td>
                <td>{row.detectedDealerName ?? "-"}</td>
                <td>
                  <div className="imports-status-stack">
                    {row.validationErrors.length > 0 && (
                      <span className="status-pill danger">
                        {row.validationErrors.length} errors
                      </span>
                    )}
                    {row.warnings.length > 0 && (
                      <span className="status-pill warning">
                        {row.warnings.length} warnings
                      </span>
                    )}
                    {row.isDuplicate && (
                      <span className="status-pill muted">duplicate</span>
                    )}
                    {row.validationErrors.length === 0 &&
                      row.warnings.length === 0 &&
                      !row.isDuplicate && (
                        <span className="status-pill success">clean</span>
                      )}
                  </div>
                  {row.validationErrors.length > 0 && (
                    <ul className="inline-issues">
                      {row.validationErrors.map((issue) => (
                        <li key={`${row.id}-${issue.code}`}>{issue.message}</li>
                      ))}
                    </ul>
                  )}
                  {row.warnings.length > 0 && (
                    <ul className="inline-issues warning">
                      {row.warnings.map((issue) => (
                        <li key={`${row.id}-${issue.code}`}>{issue.message}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
                  <pre className="payload-block">
                    {JSON.stringify(row.originalPayload, null, 2)}
                  </pre>
                </td>
                <td>
                  <pre className="payload-block">
                    {JSON.stringify(row.normalizedPayload, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
