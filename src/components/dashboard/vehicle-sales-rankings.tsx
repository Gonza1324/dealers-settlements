import type {
  VehicleSalesRankRecord,
  VehicleSalesRankings,
} from "@/features/dashboard/types";

function RankingList({
  rows,
  title,
}: {
  rows: VehicleSalesRankRecord[];
  title: string;
}) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  return (
    <article className="vehicle-ranking-card">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="muted small-text">No sold vehicle data for this filter.</p>
      ) : (
        <ol>
          {rows.map((row) => (
            <li key={row.label}>
              <div className="vehicle-ranking-row">
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </div>
              <div className="vehicle-ranking-track" aria-hidden="true">
                <span style={{ width: `${Math.max(8, (row.count / maxCount) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function VehicleSalesRankingsPanel({
  rankings,
}: {
  rankings: VehicleSalesRankings;
}) {
  return (
    <section className="panel vehicle-rankings-panel">
      <div className="dashboard-card-header compact">
        <div>
          <p className="eyebrow">Vehicle stats</p>
          <h2>Sold vehicle mix</h2>
        </div>
      </div>
      <div className="vehicle-rankings-grid">
        <RankingList rows={rankings.byModel} title="Top models" />
        <RankingList rows={rankings.byMake} title="Top makes" />
        <RankingList rows={rankings.byYear} title="Top years" />
      </div>
    </section>
  );
}
