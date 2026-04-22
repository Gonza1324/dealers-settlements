"use client";

import { useActionState, useEffect, useState } from "react";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { initialFormState } from "@/features/masters/shared/form-state";
import {
  saveSettingsUser,
  sendSettingsUserPasswordReset,
  toggleSettingsUserActiveStatus,
} from "@/features/settings/users/actions";
import type { SettingsUserRecord } from "@/features/settings/users/types";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Never";
  }

  return value.slice(0, 10);
}

function UserAssignmentStatus({ user }: { user: SettingsUserRecord }) {
  if (!user.hasProfile) {
    return (
      <div className="inline-stack">
        <StatusPill tone="danger">missing profile</StatusPill>
        <div className="small-text muted">
          This auth user does not have a synced profile record yet.
        </div>
      </div>
    );
  }

  if (user.role !== "partner_viewer") {
    return (
      <div className="inline-stack">
        <StatusPill tone="muted">not required</StatusPill>
        <div className="small-text muted">
          Partner assignment is only relevant for partner viewers.
        </div>
      </div>
    );
  }

  if (user.partnerName) {
    return (
      <div className="inline-stack">
        <StatusPill tone="success">assigned</StatusPill>
        <div className="small-text muted">{user.partnerName}</div>
      </div>
    );
  }

  return (
    <div className="inline-stack">
      <StatusPill tone="warning">warning</StatusPill>
      <div className="small-text warning-text">
        This user has no partner assigned and will not see partner-scoped business
        data.
      </div>
    </div>
  );
}

export function UsersSettingsPanel({ users }: { users: SettingsUserRecord[] }) {
  const [selectedUser, setSelectedUser] = useState<SettingsUserRecord | null>(null);
  const [filter, setFilter] = useState("");
  const [draftRole, setDraftRole] = useState<SettingsUserRecord["role"]>("partner_viewer");
  const [saveState, saveAction] = useActionState(saveSettingsUser, initialFormState);
  const [resetState, resetAction] = useActionState(
    sendSettingsUserPasswordReset,
    initialFormState,
  );
  const [statusState, statusAction] = useActionState(
    toggleSettingsUserActiveStatus,
    initialFormState,
  );

  useEffect(() => {
    setDraftRole(selectedUser?.role ?? "partner_viewer");
  }, [selectedUser]);

  useEffect(() => {
    if (saveState.success) {
      setSelectedUser(null);
      setDraftRole("partner_viewer");
    }
  }, [saveState.success]);

  const normalizedFilter = filter.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedFilter) {
      return true;
    }

    return (
      user.fullName.toLowerCase().includes(normalizedFilter) ||
      user.email.toLowerCase().includes(normalizedFilter)
    );
  });

  const selectedUserNeedsPartnerWarning =
    draftRole === "partner_viewer" && !selectedUser?.partnerId;

  return (
    <section className="masters-grid">
      <article className="panel">
        <div className="masters-toolbar">
          <div>
            <p className="eyebrow">Users</p>
            <h2 style={{ marginTop: 0 }}>Access management</h2>
            <p className="muted" style={{ marginBottom: 0 }}>
              Manage backoffice users, roles, activation state, and password reset
              emails.
            </p>
          </div>
          <input
            className="masters-filter"
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter users"
            value={filter}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Create the first admin or adjust the current filter."
          />
        ) : (
          <DataTable
            columns={[
              { key: "user", label: "User" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status" },
              { key: "assignment", label: "Partner assignment" },
              { key: "activity", label: "Activity" },
              { key: "actions", label: "Actions" },
            ]}
          >
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.fullName}</strong>
                  <div className="small-text muted">{user.email}</div>
                </td>
                <td>
                  <StatusPill tone={user.role === "super_admin" ? "success" : "muted"}>
                    {user.role}
                  </StatusPill>
                </td>
                <td>
                  <StatusPill tone={user.isActive ? "success" : "muted"}>
                    {user.isActive ? "active" : "inactive"}
                  </StatusPill>
                </td>
                <td>
                  <UserAssignmentStatus user={user} />
                </td>
                <td>
                  <div className="small-text muted">
                    Created: {formatTimestamp(user.createdAt)}
                  </div>
                  <div className="small-text muted">
                    Last sign-in: {formatTimestamp(user.lastSignInAt)}
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="ghost-button"
                      onClick={() => setSelectedUser(user)}
                      type="button"
                    >
                      Edit
                    </button>
                    <form action={resetAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <input name="email" type="hidden" value={user.email} />
                      <button className="ghost-button" type="submit">
                        Send reset
                      </button>
                    </form>
                    <form action={statusAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <input name="email" type="hidden" value={user.email} />
                      <input
                        name="nextIsActive"
                        type="hidden"
                        value={user.isActive ? "false" : "true"}
                      />
                      <ConfirmSubmitButton
                        className={user.isActive ? "ghost-button danger" : "ghost-button"}
                        confirmMessage={
                          user.isActive
                            ? `Deactivate ${user.email}? They will keep their auth account but lose app access.`
                            : `Activate ${user.email}?`
                        }
                        pendingLabel={user.isActive ? "Deactivating..." : "Activating..."}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {(resetState.message || resetState.error || statusState.message || statusState.error) && (
          <div className="inline-stack" style={{ marginTop: 16 }}>
            {resetState.message && <p className="success-text">{resetState.message}</p>}
            {resetState.error && <p className="error-text">{resetState.error}</p>}
            {statusState.message && <p className="success-text">{statusState.message}</p>}
            {statusState.error && <p className="error-text">{statusState.error}</p>}
          </div>
        )}
      </article>

      <article className="panel">
        <p className="eyebrow">{selectedUser ? "Edit user" : "New user"}</p>
        <form action={saveAction} className="masters-form">
          <input name="id" type="hidden" value={selectedUser?.id ?? ""} />
          <label className="field">
            <span>Full name</span>
            <input defaultValue={selectedUser?.fullName ?? ""} name="fullName" />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              defaultValue={selectedUser?.email ?? ""}
              name="email"
              type="email"
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select
              defaultValue={selectedUser?.role ?? "partner_viewer"}
              name="role"
              onChange={(event) =>
                setDraftRole(event.target.value as SettingsUserRecord["role"])
              }
            >
              <option value="super_admin">super_admin</option>
              <option value="expense_admin">expense_admin</option>
              <option value="partner_viewer">partner_viewer</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              defaultValue={selectedUser?.isActive ? "true" : "false"}
              name="isActive"
            >
              <option value="true">active</option>
              <option value="false">inactive</option>
            </select>
          </label>

          {selectedUserNeedsPartnerWarning && (
            <div className="warning-panel masters-form-wide">
              <p className="warning-text" style={{ margin: 0, fontWeight: 700 }}>
                This user has no partner assigned.
              </p>
              <p className="small-text muted" style={{ margin: "6px 0 0" }}>
                Partner viewers can sign in, but they will not see partner-scoped
                business data until a partner record is linked through the partners
                admin screen.
              </p>
            </div>
          )}

          <div className="table-actions masters-form-wide">
            <button className="action-button" type="submit">
              {selectedUser ? "Save user" : "Create and invite user"}
            </button>
            {selectedUser && (
              <button
                className="ghost-button"
                onClick={() => {
                  setSelectedUser(null);
                  setDraftRole("partner_viewer");
                }}
                type="button"
              >
                Clear
              </button>
            )}
          </div>

          {saveState.error && <p className="error-text masters-form-wide">{saveState.error}</p>}
          {saveState.message && (
            <p className="success-text masters-form-wide">{saveState.message}</p>
          )}
        </form>
      </article>
    </section>
  );
}
