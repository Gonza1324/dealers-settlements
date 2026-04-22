import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { ImportHistoryRecord } from "@/features/imports/types";

export function ImportsHistoryTable({
  imports,
}: {
  imports: ImportHistoryRecord[];
}) {
  if (imports.length === 0) {
    return (
      <EmptyState
        title="No imports yet"
        description="Upload the first file to start the staging and approval flow."
      />
    );
  }

  return (
    <section className="panel" style={{ marginTop: 24 }}>
      <p className="eyebrow">Recent imports</p>
      <h2 style={{ marginTop: 0 }}>Imports pending review</h2>
      <DataTable
        columns={[
          { key: "month", label: "Source month" },
          { key: "file", label: "File" },
          { key: "status", label: "Status" },
          { key: "rows", label: "Rows" },
          { key: "review", label: "Review progress" },
          { key: "actions", label: "Actions" },
        ]}
      >
        {imports.map((record) => (
          <tr key={record.id}>
            <td>{record.sourceMonth}</td>
            <td>{record.originalFilename}</td>
            <td>
              <StatusPill
                tone={
                  record.status === "error"
                    ? "danger"
                    : record.status === "consolidated"
                      ? "success"
                      : "warning"
                }
              >
                {record.status}
              </StatusPill>
            </td>
            <td>{record.rowCount}</td>
            <td>
              <div className="small-text">Pending: {record.pendingRows}</div>
              <div className="small-text">Approved: {record.approvedRows}</div>
              <div className="small-text">Ready: {record.readyRows}</div>
              <div className="small-text">Consolidated: {record.consolidatedRows}</div>
            </td>
            <td>
              <Link className="ghost-button" href={`/imports/${record.id}`}>
                Open review
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
