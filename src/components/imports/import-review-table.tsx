"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImportRowEditForm } from "@/components/imports/import-row-edit-form";
import { mapImportReviewPayload } from "@/features/imports/mappers";
import type { ImportRowReview } from "@/features/imports/types";
import type { ConsolidationSummary } from "@/features/deals/types";

type ValidationFilter = "all" | "valid" | "warning" | "invalid";
type DuplicateFilter = "all" | "unique" | "possible_duplicate" | "duplicate";
type ReviewFilter = "all" | "pending" | "approved" | "rejected";

const FIELD_LABELS: Record<string, string> = {
  yearValue: "Year",
  makeValue: "Make",
  modelValue: "Model",
  vinValue: "VIN",
  saleValue: "Sale date",
  financeRaw: "Finance",
  netGrossValue: "Net Gross",
  pickupValue: "Pick Up",
};

function renderIssueLabel(field: string | undefined, message: string) {
  if (!field) {
    return message;
  }

  return `${FIELD_LABELS[field] ?? field}: ${message}`;
}

export function ImportReviewTable({
  importFileId,
  initialRows,
}: {
  importFileId: string;
  initialRows: ImportRowReview[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [validationFilter, setValidationFilter] =
    useState<ValidationFilter>("all");
  const [duplicateFilter, setDuplicateFilter] =
    useState<DuplicateFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [consolidationSummary, setConsolidationSummary] =
    useState<ConsolidationSummary | null>(null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesValidation =
        validationFilter === "all" || row.validationStatus === validationFilter;
      const matchesDuplicate =
        duplicateFilter === "all" || row.duplicateStatus === duplicateFilter;
      const matchesReview =
        reviewFilter === "all" || row.reviewStatus === reviewFilter;

      return matchesValidation && matchesDuplicate && matchesReview;
    });
  }, [duplicateFilter, reviewFilter, rows, validationFilter]);

  async function refreshReview() {
    const response = await fetch(`/api/imports/${importFileId}`);
    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Failed to refresh review.",
      );
    }

    const review = mapImportReviewPayload(data);
    setRows(review.rows);
    setSelectedRowIds((current) =>
      current.filter((id) =>
        review.rows.some((row) => row.id === id && !row.isConsolidated),
      ),
    );
    router.refresh();
  }

  async function runAction(payload: unknown) {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setConsolidationSummary(null);

    try {
      const response = await fetch(`/api/imports/${importFileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as
        | { error: string }
        | Record<string, unknown>;

      if (!response.ok) {
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Review action failed.",
        );
      }

      const review = mapImportReviewPayload(data as Record<string, unknown>);
      setRows(review.rows);
      setEditingRowId(null);
      setSelectedRowIds((current) =>
        current.filter((id) =>
          review.rows.some((row) => row.id === id && !row.isConsolidated),
        ),
      );
      setSuccessMessage("Review updated.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Review action failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function consolidateSelectedRows() {
    if (selectedRowIds.length === 0) {
      setError("Select at least one row to consolidate.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setConsolidationSummary(null);

    try {
      const response = await fetch("/api/imports/consolidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          importFileId,
          rowIds: selectedRowIds,
        }),
      });
      const data = (await response.json()) as
        | { error?: string }
        | ConsolidationSummary;

      if (!response.ok) {
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Consolidation failed.",
        );
      }

      setConsolidationSummary(data as ConsolidationSummary);
      setSuccessMessage("Consolidation finished.");
      await refreshReview();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Consolidation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleRowSelection(rowId: string) {
    setSelectedRowIds((current) =>
      current.includes(rowId)
        ? current.filter((id) => id !== rowId)
        : [...current, rowId],
    );
  }

  function selectApprovedVisibleRows() {
    setSelectedRowIds(
      filteredRows
        .filter((row) => row.reviewStatus === "approved" && !row.isConsolidated)
        .map((row) => row.id),
    );
  }

  return (
    <section className="panel">
      <div className="imports-toolbar">
        <div>
          <p className="eyebrow">Row review</p>
          <h2 style={{ marginTop: 0 }}>Staging rows before consolidation</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            Edit normalized values, review duplicate flags and approve only the
            rows that are truly ready for the next phase.
          </p>
        </div>
        <div className="imports-filters">
          <button
            className="secondary-button"
            disabled={isSubmitting}
            onClick={selectApprovedVisibleRows}
            type="button"
          >
            Select approved
          </button>
          <label className="field compact">
            <span>Validation</span>
            <select
              value={validationFilter}
              onChange={(event) =>
                setValidationFilter(event.target.value as ValidationFilter)
              }
            >
              <option value="all">All</option>
              <option value="valid">Valid</option>
              <option value="warning">Warning</option>
              <option value="invalid">Invalid</option>
            </select>
          </label>
          <label className="field compact">
            <span>Duplicates</span>
            <select
              value={duplicateFilter}
              onChange={(event) =>
                setDuplicateFilter(event.target.value as DuplicateFilter)
              }
            >
              <option value="all">All</option>
              <option value="unique">Unique</option>
              <option value="possible_duplicate">Possible</option>
              <option value="duplicate">Exact</option>
            </select>
          </label>
          <label className="field compact">
            <span>Review</span>
            <select
              value={reviewFilter}
              onChange={(event) =>
                setReviewFilter(event.target.value as ReviewFilter)
              }
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <button
            className="action-button"
            disabled={isSubmitting}
            onClick={() => runAction({ action: "approve_ready_rows" })}
            type="button"
          >
            {isSubmitting ? "Working..." : "Approve ready rows"}
          </button>
          <button
            className="action-button"
            disabled={isSubmitting || selectedRowIds.length === 0}
            onClick={consolidateSelectedRows}
            type="button"
          >
            {isSubmitting ? "Working..." : `Consolidate selected (${selectedRowIds.length})`}
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}
      {consolidationSummary && (
        <div className="inline-alert" style={{ marginBottom: 18 }}>
          <p className="eyebrow">Consolidation summary</p>
          <p style={{ marginTop: 0 }}>
            Consolidated {consolidationSummary.consolidatedCount}, skipped{" "}
            {consolidationSummary.skippedCount}, failed {consolidationSummary.failedCount}.
          </p>
          <div className="table-actions">
            <button
              className="ghost-button"
              onClick={() => router.push("/deals")}
              type="button"
            >
              Open deals
            </button>
          </div>
        </div>
      )}

      <div className="imports-table-wrapper">
        <table className="imports-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Row</th>
              <th>VIN</th>
              <th>Sale date</th>
              <th>Finance</th>
              <th>Dealer</th>
              <th>Validation</th>
              <th>Duplicate</th>
              <th>Review</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    checked={selectedRowIds.includes(row.id)}
                    disabled={isSubmitting || row.isConsolidated}
                    onChange={() => toggleRowSelection(row.id)}
                    type="checkbox"
                  />
                </td>
                <td>{row.rowNumber}</td>
                <td>{row.normalizedPayload.vinValue ?? "-"}</td>
                <td>
                  {row.normalizedPayload.saleValue === null
                    ? "-"
                    : row.normalizedPayload.saleValue}
                </td>
                <td>
                  <strong>{row.detectedFinancierName ?? "-"}</strong>
                  <div className="muted small-text">
                    {row.normalizedPayload.financeRaw ?? "-"}
                  </div>
                </td>
                <td>{row.detectedDealerName ?? "-"}</td>
                <td>
                  <div className="imports-status-stack">
                    <span className={`status-pill ${row.validationStatus}`}>
                      {row.validationStatus}
                    </span>
                    {row.validationErrors.length > 0 && (
                      <ul className="inline-issues">
                        {row.validationErrors.map((issue) => (
                          <li key={`${row.id}-${issue.code}`}>
                            {renderIssueLabel(issue.field, issue.message)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {row.warnings.length > 0 && (
                      <ul className="inline-issues warning">
                        {row.warnings.map((issue) => (
                          <li key={`${row.id}-${issue.code}`}>
                            {renderIssueLabel(issue.field, issue.message)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={`status-pill ${
                      row.duplicateStatus === "unique"
                        ? "success"
                        : row.duplicateStatus === "duplicate"
                          ? "danger"
                          : "warning"
                    }`}
                  >
                    {row.duplicateStatus}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-pill ${
                      row.reviewStatus === "approved"
                        ? "success"
                        : row.reviewStatus === "rejected"
                          ? "muted"
                          : "warning"
                    }`}
                  >
                    {row.reviewStatus}
                  </span>
                  {row.isReadyForConsolidation && (
                    <div className="muted small-text">ready later</div>
                  )}
                  {row.isConsolidated && (
                    <div className="muted small-text">deal created</div>
                  )}
                </td>
                <td>
                  <div className="imports-row-buttons">
                    <button
                      className="secondary-button"
                      disabled={isSubmitting}
                      onClick={() =>
                        setEditingRowId((current) =>
                          current === row.id ? null : row.id,
                        )
                      }
                      type="button"
                    >
                      {editingRowId === row.id ? "Close" : "Edit"}
                    </button>
                    {row.isConsolidated && row.consolidatedDealId && (
                      <button
                        className="secondary-button"
                        onClick={() => router.push(`/deals/${row.consolidatedDealId}`)}
                        type="button"
                      >
                        View deal
                      </button>
                    )}
                    <button
                      className="secondary-button"
                      disabled={
                        isSubmitting || !row.isApprovable || row.isConsolidated
                      }
                      onClick={() =>
                        runAction({ action: "approve_row", rowId: row.id })
                      }
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="secondary-button danger"
                      disabled={isSubmitting}
                      onClick={() =>
                        runAction({ action: "reject_row", rowId: row.id })
                      }
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRows.map((row) =>
        editingRowId === row.id ? (
          <div key={`${row.id}-editor`} className="panel import-row-editor">
            <div style={{ marginBottom: 16 }}>
              <p className="eyebrow">Row {row.rowNumber}</p>
              <h3 style={{ marginTop: 0 }}>Edit normalized values</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Changes are saved back into staging and logged in
                `import_review_actions`.
              </p>
            </div>

            <ImportRowEditForm
              row={row}
              isSaving={isSubmitting}
              onCancel={() => setEditingRowId(null)}
              onSave={(payload) =>
                runAction({
                  action: "update_row",
                  payload,
                })
              }
            />

            <div className="grid two" style={{ marginTop: 20 }}>
              <div>
                <p className="eyebrow">Original payload</p>
                <pre className="payload-block">
                  {JSON.stringify(row.originalPayload, null, 2)}
                </pre>
              </div>
              <div>
                <p className="eyebrow">Normalized payload</p>
                <pre className="payload-block">
                  {JSON.stringify(row.normalizedPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : null,
      )}
    </section>
  );
}
