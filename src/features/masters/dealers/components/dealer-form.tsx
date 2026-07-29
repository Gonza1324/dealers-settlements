"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  archiveAssignment,
  archiveDealer,
  archiveShare,
  restoreDealer,
  saveAssignment,
  saveDealer,
  saveShare,
} from "@/features/masters/dealers/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type {
  DealerAssignmentRecord,
  DealerShareRecord,
  DealerWithShareAlert,
} from "@/features/masters/dealers/types";
import type { FinancierRow, PartnerRow } from "@/types/database";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormFeedback } from "@/components/ui/form-feedback";
import { StatusPill } from "@/components/ui/status-pill";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

type ShareSortKey = "dealer" | "partner";
type ShareSortDirection = "asc" | "desc";
type ShareSortState = {
  key: ShareSortKey;
  direction: ShareSortDirection;
} | null;

function nextShareSort(
  current: ShareSortState,
  key: ShareSortKey,
): ShareSortState {
  if (current?.key === key) {
    return {
      key,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }

  return { key, direction: "asc" };
}

function shareSortHeading(
  label: string,
  key: ShareSortKey,
  sort: ShareSortState,
  onSort: (key: ShareSortKey) => void,
) {
  const isActive = sort?.key === key;
  const direction = isActive ? sort.direction : null;

  return (
    <button
      aria-label={`${label}, ${
        isActive ? `${direction === "asc" ? "ascending" : "descending"}` : "not sorted"
      }. Click to sort ${isActive && direction === "asc" ? "descending" : "ascending"}.`}
      className="table-sort-link table-sort-button"
      onClick={() => onSort(key)}
      type="button"
    >
      {label}
      <span aria-hidden="true" className="table-sort-indicator">
        {isActive ? (direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

function DealerEditor({
  archivedDealers,
  dealers,
  canEdit,
}: {
  archivedDealers: DealerWithShareAlert[];
  dealers: DealerWithShareAlert[];
  canEdit: boolean;
}) {
  const [selectedDealer, setSelectedDealer] = useState<DealerWithShareAlert | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [state, formAction] = useActionState(saveDealer, initialFormState);
  const displayedDealers = showArchived ? archivedDealers : dealers;

  useEffect(() => {
    if (state.success) {
      setSelectedDealer(null);
    }
  }, [state.success]);

  return (
    <section className="masters-grid">
      <article className="panel">
        <div className="masters-section-header">
          <div>
            <p className="eyebrow">Dealers</p>
            <h2 style={{ marginTop: 0 }}>Dealer registry</h2>
          </div>
          {canEdit && (
            <div className="table-actions">
              <button
                className="ghost-button"
                onClick={() => {
                  setShowArchived((current) => !current);
                  setSelectedDealer(null);
                }}
                type="button"
              >
                {showArchived ? "View active dealers" : "View archived dealers"}
              </button>
              {selectedDealer && (
                <button
                  className="ghost-button"
                  onClick={() => setSelectedDealer(null)}
                  type="button"
                >
                  New dealer
                </button>
              )}
            </div>
          )}
        </div>

        {displayedDealers.length === 0 ? (
          <EmptyState
            title={showArchived ? "No archived dealers" : "No dealers yet"}
            description={
              showArchived
                ? "Archived dealers will appear here."
                : "Create the first dealer to start managing shares and financista assignments."
            }
          />
        ) : (
          <DataTable
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Name" },
              { key: "status", label: "Status" },
              { key: "shares", label: "Current shares" },
              { key: "actions", label: "Actions" },
            ]}
          >
            {displayedDealers.map((dealer) => (
              <tr key={dealer.id}>
                <td>{dealer.code}</td>
                <td>{dealer.name}</td>
                <td>
                  <StatusPill
                    tone={
                      dealer.status === "active"
                        ? "success"
                        : dealer.status === "paused"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {dealer.status}
                  </StatusPill>
                </td>
                <td>
                  {dealer.currentShareTotal.toFixed(2)}%
                  {dealer.shareAlert && (
                    <div style={{ marginTop: 6 }}>
                      <StatusPill tone="warning">alert</StatusPill>
                    </div>
                  )}
                </td>
                <td>
                  {canEdit ? (
                    <div className="table-actions">
                      <button
                        className="ghost-button"
                        onClick={() => setSelectedDealer(dealer)}
                        type="button"
                      >
                        Edit
                      </button>
                      {showArchived ? (
                        <form
                          action={async () => {
                            await restoreDealer(dealer.id);
                          }}
                        >
                          <ConfirmSubmitButton
                            className="ghost-button"
                            confirmMessage={`Restore dealer "${dealer.name}" to the active registry?`}
                            pendingLabel="Restoring..."
                          >
                            Restore
                          </ConfirmSubmitButton>
                        </form>
                      ) : (
                        <form
                          action={async () => {
                            await archiveDealer(dealer.id);
                          }}
                        >
                          <ConfirmSubmitButton
                            className="ghost-button danger"
                            confirmMessage={`Archive dealer "${dealer.name}"? Historical records stay available, but it will leave the active registry.`}
                            pendingLabel="Archiving..."
                          >
                            Archive
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </div>
                  ) : (
                    <span className="muted">Read only</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </article>

      {canEdit && (
        <article className="panel">
          <p className="eyebrow">
            {selectedDealer ? "Edit dealer" : "New dealer"}
          </p>
          <form action={formAction} className="masters-form">
            <input name="id" type="hidden" value={selectedDealer?.id ?? ""} />
            <label className="field">
              <span>Code</span>
              <input
                defaultValue={selectedDealer?.code ?? ""}
                name="code"
                type="number"
              />
            </label>
            <label className="field">
              <span>Name</span>
              <input defaultValue={selectedDealer?.name ?? ""} name="name" />
            </label>
            <label className="field">
              <span>Status</span>
              <select defaultValue={selectedDealer?.status ?? "active"} name="status">
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="closed">closed</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <button className="action-button" type="submit">
              {selectedDealer ? "Save dealer" : "Create dealer"}
            </button>
            <FormFeedback message={state.error} tone="error" />
            <FormFeedback message={state.message} tone="success" />
          </form>
        </article>
      )}
    </section>
  );
}

function SharesEditor({
  dealers,
  partners,
  shares,
  canEdit,
}: {
  dealers: DealerWithShareAlert[];
  partners: PartnerRow[];
  shares: DealerShareRecord[];
  canEdit: boolean;
}) {
  const [selectedShare, setSelectedShare] = useState<DealerShareRecord | null>(null);
  const [shareSort, setShareSort] = useState<ShareSortState>(null);
  const [state, formAction] = useActionState(saveShare, initialFormState);
  const sortedShares = useMemo(() => {
    if (!shareSort) {
      return shares;
    }

    const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
    const direction = shareSort.direction === "asc" ? 1 : -1;

    return shares
      .map((share, index) => ({ share, index }))
      .sort((left, right) => {
        const leftValue =
          shareSort.key === "dealer" ? left.share.dealer_name : left.share.partner_name;
        const rightValue =
          shareSort.key === "dealer" ? right.share.dealer_name : right.share.partner_name;
        const comparison = collator.compare(leftValue, rightValue);

        return comparison === 0 ? left.index - right.index : comparison * direction;
      })
      .map(({ share }) => share);
  }, [shareSort, shares]);

  function handleShareSort(key: ShareSortKey) {
    setShareSort((current) => nextShareSort(current, key));
  }

  useEffect(() => {
    if (state.success) {
      setSelectedShare(null);
    }
  }, [state.success]);

  return (
    <section className="masters-grid">
      <article className="panel">
        <div className="masters-section-header">
          <div>
            <p className="eyebrow">Partner shares</p>
            <h2 style={{ marginTop: 0 }}>Shares by validity</h2>
          </div>
        </div>
        <div className="alert-stack">
          {dealers
            .filter((dealer) => dealer.shareAlert)
            .map((dealer) => (
              <div className="inline-alert warning" key={dealer.id}>
                Current active shares for <strong>{dealer.name}</strong> add up to{" "}
                {dealer.currentShareTotal.toFixed(2)}%, not 100%.
              </div>
            ))}
        </div>
        <DataTable
          columns={[
            {
              key: "dealer",
              label: shareSortHeading("Dealer", "dealer", shareSort, handleShareSort),
              ariaSort:
                shareSort?.key === "dealer"
                  ? shareSort.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none",
            },
            {
              key: "partner",
              label: shareSortHeading("Partner", "partner", shareSort, handleShareSort),
              ariaSort:
                shareSort?.key === "partner"
                  ? shareSort.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none",
            },
            { key: "share", label: "Share %" },
            { key: "from", label: "Valid from" },
            { key: "to", label: "Valid to" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {sortedShares.map((share) => (
            <tr key={share.id}>
              <td>{share.dealer_name}</td>
              <td>{share.partner_name}</td>
              <td>{Number(share.share_percentage).toFixed(2)}%</td>
              <td>{share.valid_from}</td>
              <td>{share.valid_to ?? "open"}</td>
              <td>
                {canEdit ? (
                  <div className="table-actions">
                    <button
                      className="ghost-button"
                      onClick={() => setSelectedShare(share)}
                      type="button"
                    >
                      Edit
                    </button>
                    <form
                      action={async () => {
                        await archiveShare(share.id);
                      }}
                    >
                      <ConfirmSubmitButton
                        className="ghost-button danger"
                        confirmMessage={`Remove the share for ${share.partner_name} on ${share.dealer_name}? Historical calculations stay preserved.`}
                        pendingLabel="Removing..."
                      >
                        Remove
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ) : (
                  <span className="muted">Read only</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </article>

      {canEdit && (
        <article className="panel">
          <p className="eyebrow">
            {selectedShare ? "Edit share" : "New share"}
          </p>
          <form action={formAction} className="masters-form">
            <input name="id" type="hidden" value={selectedShare?.id ?? ""} />
            <label className="field">
              <span>Dealer</span>
              <select
                defaultValue={selectedShare?.dealer_id ?? dealers[0]?.id ?? ""}
                name="dealer_id"
              >
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Partner</span>
              <select
                defaultValue={selectedShare?.partner_id ?? partners[0]?.id ?? ""}
                name="partner_id"
              >
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Share percentage</span>
              <input
                defaultValue={selectedShare?.share_percentage ?? ""}
                name="share_percentage"
                step="0.01"
                type="number"
              />
            </label>
            <label className="field">
              <span>Valid from</span>
              <input
                defaultValue={selectedShare?.valid_from ?? ""}
                name="valid_from"
                type="date"
              />
            </label>
            <label className="field">
              <span>Valid to</span>
              <input
                defaultValue={selectedShare?.valid_to ?? ""}
                name="valid_to"
                type="date"
              />
            </label>
            <label className="field masters-form-wide">
              <span>Notes</span>
              <textarea defaultValue={selectedShare?.notes ?? ""} name="notes" rows={3} />
            </label>
            <button className="action-button" type="submit">
              {selectedShare ? "Save share" : "Create share"}
            </button>
            <FormFeedback message={state.error} tone="error" />
            <FormFeedback message={state.message} tone="success" />
          </form>
        </article>
      )}
    </section>
  );
}

function AssignmentsEditor({
  dealers,
  financiers,
  assignments,
  canEdit,
}: {
  dealers: DealerWithShareAlert[];
  financiers: FinancierRow[];
  assignments: DealerAssignmentRecord[];
  canEdit: boolean;
}) {
  const [selectedAssignment, setSelectedAssignment] =
    useState<DealerAssignmentRecord | null>(null);
  const [state, formAction] = useActionState(saveAssignment, initialFormState);

  useEffect(() => {
    if (state.success) {
      setSelectedAssignment(null);
    }
  }, [state.success]);

  return (
    <section className="masters-grid">
      <article className="panel">
        <div className="masters-section-header">
          <div>
            <p className="eyebrow">Financista assignments</p>
            <h2 style={{ marginTop: 0 }}>Dealer assignment ranges</h2>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "dealer", label: "Dealer" },
            { key: "financier", label: "Financista" },
            { key: "from", label: "Start date" },
            { key: "to", label: "End date" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {assignments.map((assignment) => (
            <tr key={assignment.id}>
              <td>{assignment.dealer_name}</td>
              <td>{assignment.financier_name}</td>
              <td>{assignment.start_date}</td>
              <td>{assignment.end_date ?? "open"}</td>
              <td>
                {canEdit ? (
                  <div className="table-actions">
                    <button
                      className="ghost-button"
                      onClick={() => setSelectedAssignment(assignment)}
                      type="button"
                    >
                      Edit
                    </button>
                    <form
                      action={async () => {
                        await archiveAssignment(assignment.id);
                      }}
                    >
                      <ConfirmSubmitButton
                        className="ghost-button danger"
                        confirmMessage={`Remove the financista assignment ${assignment.financier_name} -> ${assignment.dealer_name}?`}
                        pendingLabel="Removing..."
                      >
                        Remove
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ) : (
                  <span className="muted">Read only</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </article>

      {canEdit && (
        <article className="panel">
          <p className="eyebrow">
            {selectedAssignment ? "Edit assignment" : "New assignment"}
          </p>
          <form action={formAction} className="masters-form">
            <input name="id" type="hidden" value={selectedAssignment?.id ?? ""} />
            <label className="field">
              <span>Dealer</span>
              <select
                defaultValue={
                  selectedAssignment?.dealer_id ?? dealers[0]?.id ?? ""
                }
                name="dealer_id"
              >
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Financista</span>
              <select
                defaultValue={
                  selectedAssignment?.financier_id ?? financiers[0]?.id ?? ""
                }
                name="financier_id"
              >
                {financiers.map((financier) => (
                  <option key={financier.id} value={financier.id}>
                    {financier.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Start date</span>
              <input
                defaultValue={selectedAssignment?.start_date ?? ""}
                name="start_date"
                type="date"
              />
            </label>
            <label className="field">
              <span>End date</span>
              <input
                defaultValue={selectedAssignment?.end_date ?? ""}
                name="end_date"
                type="date"
              />
            </label>
            <label className="field masters-form-wide">
              <span>Notes</span>
              <textarea
                defaultValue={selectedAssignment?.financial_notes ?? ""}
                name="financial_notes"
                rows={3}
              />
            </label>
            <button className="action-button" type="submit">
              {selectedAssignment ? "Save assignment" : "Create assignment"}
            </button>
            <FormFeedback message={state.error} tone="error" />
            <FormFeedback message={state.message} tone="success" />
          </form>
        </article>
      )}
    </section>
  );
}

export function DealersPageContent({
  archivedDealers,
  canEdit,
  dealers,
  partners,
  shares,
  financiers,
  assignments,
}: {
  archivedDealers: DealerWithShareAlert[];
  canEdit: boolean;
  dealers: DealerWithShareAlert[];
  partners: PartnerRow[];
  shares: DealerShareRecord[];
  financiers: FinancierRow[];
  assignments: DealerAssignmentRecord[];
}) {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <DealerEditor
        archivedDealers={archivedDealers}
        canEdit={canEdit}
        dealers={dealers}
      />
      <SharesEditor
        canEdit={canEdit}
        dealers={dealers}
        partners={partners}
        shares={shares}
      />
      <AssignmentsEditor
        assignments={assignments}
        canEdit={canEdit}
        dealers={dealers}
        financiers={financiers}
      />
    </div>
  );
}
