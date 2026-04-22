import type { AuditPageData } from "@/features/audit/types";

export function AuditLogTable({ data }: { data: AuditPageData }) {
  return (
    <>
      <section className="panel" style={{ marginBottom: 24 }}>
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
          <div className="table-actions">
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
                    <pre className="payload-block">
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
