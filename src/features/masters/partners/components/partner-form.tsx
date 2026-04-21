"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { savePartner } from "@/features/masters/partners/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type { PartnerRow, ProfileRow } from "@/types/database";

export function PartnersPageContent({
  partners,
  profiles,
}: {
  partners: PartnerRow[];
  profiles: ProfileRow[];
}) {
  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(null);
  const [filter, setFilter] = useState("");
  const [state, formAction] = useActionState(savePartner, initialFormState);

  useEffect(() => {
    if (state.success) {
      setSelectedPartner(null);
    }
  }, [state.success]);

  const filteredPartners = useMemo(() => {
    const normalized = filter.trim().toLowerCase();

    if (!normalized) {
      return partners;
    }

    return partners.filter((partner) =>
      partner.display_name.toLowerCase().includes(normalized),
    );
  }, [partners, filter]);

  return (
    <section className="masters-grid">
      <article className="panel">
        <div className="masters-toolbar">
          <div>
            <p className="eyebrow">Partners</p>
            <h2 style={{ marginTop: 0 }}>Partner registry</h2>
          </div>
          <input
            className="masters-filter"
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter partners"
            value={filter}
          />
        </div>

        {filteredPartners.length === 0 ? (
          <EmptyState
            title="No partners yet"
            description="Create the first partner to connect users and assign dealer shares."
          />
        ) : (
          <DataTable
            columns={[
              { key: "name", label: "Display name" },
              { key: "profile", label: "Linked profile" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions" },
            ]}
          >
            {filteredPartners.map((partner) => {
              const linkedProfile =
                profiles.find((profile) => profile.id === partner.user_id) ?? null;

              return (
                <tr key={partner.id}>
                  <td>{partner.display_name}</td>
                  <td>{linkedProfile?.full_name ?? "Not linked"}</td>
                  <td>
                    <StatusPill tone={partner.is_active ? "success" : "muted"}>
                      {partner.is_active ? "active" : "inactive"}
                    </StatusPill>
                  </td>
                  <td>
                    <button
                      className="ghost-button"
                      onClick={() => setSelectedPartner(partner)}
                      type="button"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </article>

      <article className="panel">
        <p className="eyebrow">
          {selectedPartner ? "Edit partner" : "New partner"}
        </p>
        <form action={formAction} className="masters-form">
          <input name="id" type="hidden" value={selectedPartner?.id ?? ""} />
          <label className="field">
            <span>Display name</span>
            <input
              defaultValue={selectedPartner?.display_name ?? ""}
              name="display_name"
            />
          </label>
          <label className="field">
            <span>Linked profile</span>
            <select
              defaultValue={selectedPartner?.user_id ?? ""}
              name="user_id"
            >
              <option value="">No linked user</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} ({profile.email})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              defaultValue={selectedPartner?.is_active ? "true" : "false"}
              name="is_active"
            >
              <option value="true">active</option>
              <option value="false">inactive</option>
            </select>
          </label>
          <button className="action-button" type="submit">
            {selectedPartner ? "Save partner" : "Create partner"}
          </button>
          {state.error && <p className="error-text">{state.error}</p>}
          {state.message && <p className="success-text">{state.message}</p>}
        </form>
      </article>
    </section>
  );
}
