import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { MonthlyCalculationRunRecord } from "@/features/settlements/types";

export function SettlementsRunsTable({
  runs,
}: {
  runs: MonthlyCalculationRunRecord[];
}) {
  if (runs.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="No calculation runs yet"
          description="Pick a month and execute the first monthly settlement run."
        />
      </section>
    );
  }

  return (
    <section className="panel">
      <p className="eyebrow">Calculation runs</p>
      <h2 style={{ marginTop: 0 }}>Run history</h2>
      <DataTable
        columns={[
          { key: "period", label: "Period" },
          { key: "status", label: "Status" },
          { key: "summary", label: "Summary" },
          { key: "triggered", label: "Triggered by" },
          { key: "actions", label: "Actions" },
        ]}
      >
        {runs.map((run) => (
          <tr key={run.id}>
            <td>
              {run.period_month}
              {run.is_current && (
                <div className="small-text muted">Current version</div>
              )}
            </td>
            <td>
              <StatusPill tone={run.status === "failed" ? "danger" : run.is_current ? "success" : "muted"}>
                {run.status}
              </StatusPill>
            </td>
            <td>
              <div className="small-text">Dealers: {run.summary_json.dealersCalculated}</div>
              <div className="small-text">Partners: {run.summary_json.partnersCalculated}</div>
              <div className="small-text">Net total: {run.summary_json.netTotal}</div>
              <div className="small-text">Errors: {run.summary_json.errorCount}</div>
            </td>
            <td>
              {run.triggered_by_name ?? "-"}
              <div className="small-text muted">{run.triggered_by_email ?? ""}</div>
            </td>
            <td>
              <Link className="ghost-button" href={`/settlements/${run.id}`}>
                View detail
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
