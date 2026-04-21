import type { DealHistoryRecord } from "@/features/deals/types";

export function DealHistoryList({ history }: { history: DealHistoryRecord[] }) {
  return (
    <section className="panel">
      <p className="eyebrow">Edit history</p>
      <h2 style={{ marginTop: 0 }}>Manual changes</h2>

      {history.length === 0 ? (
        <p className="muted" style={{ marginBottom: 0 }}>
          This deal has not been edited manually yet.
        </p>
      ) : (
        <div className="grid" style={{ gap: 16 }}>
          {history.map((entry) => (
            <article key={entry.id} className="inline-alert">
              <p className="eyebrow">Edited at {entry.changed_at}</p>
              <p style={{ marginTop: 0 }}>
                {entry.changed_by_name ?? "Unknown user"}
                {entry.changed_by_email ? ` (${entry.changed_by_email})` : ""}
              </p>
              <div className="grid two">
                <div>
                  <p className="eyebrow">Before</p>
                  <pre className="payload-block">
                    {JSON.stringify(entry.before_json, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="eyebrow">After</p>
                  <pre className="payload-block">
                    {JSON.stringify(entry.after_json, null, 2)}
                  </pre>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
