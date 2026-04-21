"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { archiveFinancierAlias, saveFinancier, saveFinancierAlias } from "@/features/masters/financiers/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import { normalizeAlias } from "@/features/masters/shared/utils";
import type { FinancierRow } from "@/types/database";
import type { FinancierAliasRecord } from "@/features/masters/financiers/types";

export function FinanciersPageContent({
  financiers,
  aliases,
}: {
  financiers: FinancierRow[];
  aliases: FinancierAliasRecord[];
}) {
  const [selectedFinancier, setSelectedFinancier] = useState<FinancierRow | null>(null);
  const [selectedAlias, setSelectedAlias] = useState<FinancierAliasRecord | null>(null);
  const [filter, setFilter] = useState("");
  const [aliasDraft, setAliasDraft] = useState("");
  const [selectedAliasFinancierId, setSelectedAliasFinancierId] = useState("");
  const [financierState, financierAction] = useActionState(
    saveFinancier,
    initialFormState,
  );
  const [aliasState, aliasAction] = useActionState(
    saveFinancierAlias,
    initialFormState,
  );

  useEffect(() => {
    if (financierState.success) {
      setSelectedFinancier(null);
    }
  }, [financierState.success]);

  const filteredFinanciers = useMemo(() => {
    const normalized = filter.trim().toLowerCase();

    if (!normalized) {
      return financiers;
    }

    return financiers.filter((financier) =>
      financier.name.toLowerCase().includes(normalized),
    );
  }, [filter, financiers]);

  useEffect(() => {
    if (aliasState.success) {
      setSelectedAlias(null);
      setAliasDraft("");
      setSelectedAliasFinancierId(filteredFinanciers[0]?.id ?? "");
    }
  }, [aliasState.success, filteredFinanciers]);

  useEffect(() => {
    setAliasDraft(selectedAlias?.alias ?? "");
    setSelectedAliasFinancierId(
      selectedAlias?.financier_id ?? filteredFinanciers[0]?.id ?? "",
    );
  }, [filteredFinanciers, selectedAlias]);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="masters-grid">
        <article className="panel">
          <div className="masters-toolbar">
            <div>
              <p className="eyebrow">Financiers</p>
              <h2 style={{ marginTop: 0 }}>Financier registry</h2>
            </div>
            <input
              className="masters-filter"
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter financiers"
              value={filter}
            />
          </div>

          {filteredFinanciers.length === 0 ? (
            <EmptyState
              title="No financiers yet"
              description="Create the first financier before setting aliases or dealer assignments."
            />
          ) : (
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "status", label: "Status" },
                { key: "actions", label: "Actions" },
              ]}
            >
              {filteredFinanciers.map((financier) => (
                <tr key={financier.id}>
                  <td>{financier.name}</td>
                  <td>
                    <StatusPill tone={financier.is_active ? "success" : "muted"}>
                      {financier.is_active ? "active" : "inactive"}
                    </StatusPill>
                  </td>
                  <td>
                    <button
                      className="ghost-button"
                      onClick={() => setSelectedFinancier(financier)}
                      type="button"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">
            {selectedFinancier ? "Edit financier" : "New financier"}
          </p>
          <form action={financierAction} className="masters-form">
            <input name="id" type="hidden" value={selectedFinancier?.id ?? ""} />
            <label className="field">
              <span>Name</span>
              <input defaultValue={selectedFinancier?.name ?? ""} name="name" />
            </label>
            <label className="field">
              <span>Status</span>
              <select
                defaultValue={selectedFinancier?.is_active ? "true" : "false"}
                name="is_active"
              >
                <option value="true">active</option>
                <option value="false">inactive</option>
              </select>
            </label>
            <button className="action-button" type="submit">
              {selectedFinancier ? "Save financier" : "Create financier"}
            </button>
            {financierState.error && (
              <p className="error-text">{financierState.error}</p>
            )}
            {financierState.message && (
              <p className="success-text">{financierState.message}</p>
            )}
          </form>
        </article>
      </section>

      <section className="masters-grid">
        <article className="panel">
          <div className="masters-section-header">
            <div>
              <p className="eyebrow">Aliases</p>
              <h2 style={{ marginTop: 0 }}>Financier aliases</h2>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "financier", label: "Financier" },
              { key: "alias", label: "Alias" },
              { key: "normalized", label: "Normalized" },
              { key: "actions", label: "Actions" },
            ]}
          >
            {aliases.map((alias) => (
              <tr key={alias.id}>
                <td>{alias.financier_name}</td>
                <td>{alias.alias}</td>
                <td>{alias.normalized_alias}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="ghost-button"
                      onClick={() => setSelectedAlias(alias)}
                      type="button"
                    >
                      Edit
                    </button>
                    <form
                      action={async () => {
                        await archiveFinancierAlias(alias.id);
                      }}
                    >
                      <button className="ghost-button danger" type="submit">
                        Remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </article>

        <article className="panel">
          <p className="eyebrow">{selectedAlias ? "Edit alias" : "New alias"}</p>
          <form action={aliasAction} className="masters-form">
            <input name="id" type="hidden" value={selectedAlias?.id ?? ""} />
            <label className="field">
              <span>Financier</span>
              <select
                name="financier_id"
                onChange={(event) => setSelectedAliasFinancierId(event.target.value)}
                value={selectedAliasFinancierId}
              >
                {filteredFinanciers.map((financier) => (
                  <option key={financier.id} value={financier.id}>
                    {financier.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Alias</span>
              <input
                name="alias"
                onChange={(event) => setAliasDraft(event.target.value)}
                value={aliasDraft}
              />
            </label>
            <label className="field">
              <span>Normalized preview</span>
              <input
                disabled
                placeholder="Derived automatically"
                value={aliasDraft ? normalizeAlias(aliasDraft) : ""}
              />
            </label>
            <button className="action-button" type="submit">
              {selectedAlias ? "Save alias" : "Create alias"}
            </button>
            {aliasState.error && <p className="error-text">{aliasState.error}</p>}
            {aliasState.message && (
              <p className="success-text">{aliasState.message}</p>
            )}
          </form>
        </article>
      </section>
    </div>
  );
}
