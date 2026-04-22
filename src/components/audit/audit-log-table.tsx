import type { AuditPageData } from "@/features/audit/types";

export function AuditLogTable({ data }: { data: AuditPageData }) {
  const activeFilters = [
    data.filters.entityTable && "Entity",
    data.filters.action && "Action",
  ].filter(Boolean);

  return (
    <>
      <section className="panel filter-panel">
        <div className="filter-panel-header">
          <div>
            <p className="eyebrow">Audit filters</p>
            <h2>Trace sensitive changes faster</h2>
            <p>Filter the audit trail by entity table and action type.</p>
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
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Entity</th>
                <th>Action</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt.replace("T", " ").slice(0, 19)}</td>
                  <td>{log.actorDisplay}</td>
                  <td>
                    <strong>{log.entityTable}</strong>
                    <div className="muted small-text">{log.entityId ?? "-"}</div>
                  </td>
                  <td>{log.action}</td>
                  <td>
                    <details className="audit-metadata">
                      <summary className="audit-metadata-summary">
                        <span>View</span>
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
              ))}
              {data.logs.length === 0 && (
                <tr>
                  <td className="muted" colSpan={5}>
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
