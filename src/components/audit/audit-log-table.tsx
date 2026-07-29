import { StatusPill, type StatusPillTone } from "@/components/ui/status-pill";
import type { AuditPageData } from "@/features/audit/types";

type AuditEventProfile = {
  summary: string;
  tone: StatusPillTone;
  typeLabel: string;
};

const ENTITY_LABELS: Record<string, string> = {
  dead_deals: "Dead deal",
  dealer_partner_shares: "Partner share",
  dealers: "Dealer",
  deals: "Deal",
  expenses: "Expense",
  financiers: "Financista",
  import_files: "Import",
  partner_monthly_payouts: "Partner payout",
  partners: "Partner",
  profiles: "User",
};

const FIELD_LABELS: Record<string, string> = {
  amount: "amount",
  category: "category",
  deal_profit: "deal profit",
  description: "description",
  display_name: "name",
  email: "email",
  expense_date: "expense date",
  financier_id: "financista",
  full_name: "name",
  gross_profit: "gross profit",
  name: "name",
  paid_amount: "paid amount",
  paid_at: "paid date",
  payment_status: "payment status",
  period_month: "period",
  role: "role",
  share_percentage: "share",
  status: "status",
  vin_value: "VIN",
};

function auditActionLabel(action: string) {
  return action.replaceAll("_", " ");
}

function auditActionTone(action: string): StatusPillTone {
  if (/(archived|deleted|removed|failed|rejected|deactivated)/i.test(action)) {
    return "danger";
  }

  if (/(updated|manual|reset|executed|imported)/i.test(action)) {
    return "warning";
  }

  if (/(created|restored|approved|paid|activated|consolidated)/i.test(action)) {
    return "success";
  }

  return "muted";
}

function isPlainValue(value: unknown) {
  return (
    value === null ||
    ["string", "number", "boolean"].includes(typeof value)
  );
}

function formatAuditValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }

    return value.length > 44 ? `${value.slice(0, 41)}...` : value;
  }

  return "changed";
}

function getChangedFields(
  beforeJson: Record<string, unknown>,
  afterJson: Record<string, unknown>,
) {
  const fields = new Set([...Object.keys(beforeJson), ...Object.keys(afterJson)]);

  return [...fields]
    .filter((field) => isPlainValue(beforeJson[field]) && isPlainValue(afterJson[field]))
    .filter((field) => beforeJson[field] !== afterJson[field])
    .slice(0, 4);
}

function buildAuditProfile(log: AuditPageData["logs"][number]): AuditEventProfile {
  const entity = ENTITY_LABELS[log.entityTable] ?? log.entityTable;
  const action = auditActionLabel(log.action);
  const changedFields = getChangedFields(log.beforeJson, log.afterJson);
  const tone = auditActionTone(log.action);

  if (changedFields.length > 0) {
    const fieldSummaries = changedFields.map((field) => {
      const label = FIELD_LABELS[field] ?? field.replaceAll("_", " ");

      return `${label}: ${formatAuditValue(log.beforeJson[field])} -> ${formatAuditValue(log.afterJson[field])}`;
    });

    return {
      summary: fieldSummaries.join("; "),
      tone,
      typeLabel: `${entity} ${action}`,
    };
  }

  const metadataKeys = Object.keys(log.metadata).filter((key) => isPlainValue(log.metadata[key]));
  if (metadataKeys.length > 0) {
    const metadataSummary = metadataKeys
      .slice(0, 3)
      .map((key) => `${key.replaceAll("_", " ")}: ${formatAuditValue(log.metadata[key])}`)
      .join("; ");

    return {
      summary: metadataSummary,
      tone,
      typeLabel: `${entity} ${action}`,
    };
  }

  return {
    summary: `${entity} was ${action}.`,
    tone,
    typeLabel: `${entity} ${action}`,
  };
}

export function AuditLogTable({ data }: { data: AuditPageData }) {
  const activeFilters = [
    data.filters.entityTable && "Entity",
    data.filters.action && "Action",
  ].filter(Boolean);
  const eventProfiles = data.logs.map((log) => buildAuditProfile(log));
  const highRiskCount = eventProfiles.filter((profile) => profile.tone === "danger").length;
  const reviewCount = eventProfiles.filter((profile) => profile.tone === "warning").length;
  const positiveCount = eventProfiles.filter((profile) => profile.tone === "success").length;
  const actorCount = new Set(data.logs.map((log) => log.actorDisplay)).size;

  return (
    <>
      <section className="panel filter-panel">
        <div className="filter-panel-header">
          <div>
            <p className="eyebrow">Audit filters</p>
            <h2>Trace sensitive changes faster</h2>
          </div>
          <div className="filter-summary">
            {activeFilters.length > 0 ? `${activeFilters.length} active filters` : "Showing full audit trail"}
          </div>
        </div>
        <form action="/audit" className="dashboard-filters-form" method="get">
          <label className="field compact">
            <span>Entity</span>
            <select defaultValue={data.filters.entityTable} name="entityTable">
              <option value="">All</option>
              {data.entityTables.map((entityTable) => (
                <option key={entityTable} value={entityTable}>
                  {entityTable}
                </option>
              ))}
            </select>
          </label>
          <label className="field compact">
            <span>Action</span>
            <select defaultValue={data.filters.action} name="action">
              <option value="">All</option>
              {data.actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-panel-actions">
            <button className="action-button" type="submit">
              Apply filters
            </button>
            <a className="ghost-button" href="/audit">
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="audit-summary-grid">
          <article className="dashboard-mini-card danger">
            <span>High-risk</span>
            <strong>{highRiskCount}</strong>
            <p className="muted small-text">Deletes, failures and rejections.</p>
          </article>
          <article className="dashboard-mini-card warning">
            <span>Needs review</span>
            <strong>{reviewCount}</strong>
            <p className="muted small-text">Updates and manual changes.</p>
          </article>
          <article className="dashboard-mini-card success">
            <span>Confirmed</span>
            <strong>{positiveCount}</strong>
            <p className="muted small-text">Creates, approvals and paid events.</p>
          </article>
          <article className="dashboard-mini-card">
            <span>Actors</span>
            <strong>{actorCount}</strong>
            <p className="muted small-text">Users or system sources in view.</p>
          </article>
        </div>
        <div className="dashboard-table-wrapper registry-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Entity</th>
                <th>Action</th>
                <th>Summary</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log, index) => {
                const profile = eventProfiles[index];

                return (
                  <tr className={`audit-row ${profile.tone}`} key={log.id}>
                    <td>{log.createdAt.replace("T", " ").slice(0, 19)}</td>
                    <td>{log.actorDisplay}</td>
                    <td>
                      <strong>{ENTITY_LABELS[log.entityTable] ?? log.entityTable}</strong>
                      <div className="muted small-text">{log.entityId ?? "-"}</div>
                    </td>
                    <td>
                      <StatusPill tone={profile.tone}>
                        {auditActionLabel(log.action)}
                      </StatusPill>
                    </td>
                    <td className="audit-summary-cell">
                      <strong>{profile.typeLabel}</strong>
                      <p className="muted small-text">{profile.summary}</p>
                    </td>
                    <td>
                      <details className="audit-metadata">
                        <summary className="audit-metadata-summary">
                          <span>JSON</span>
                        </summary>
                        <pre className="payload-block audit-metadata-payload">
                          {JSON.stringify(
                            {
                              before: log.beforeJson,
                              after: log.afterJson,
                              metadata: log.metadata,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </td>
                  </tr>
                );
              })}
              {data.logs.length === 0 && (
                <tr>
                  <td className="muted" colSpan={6}>
                    No audit logs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
