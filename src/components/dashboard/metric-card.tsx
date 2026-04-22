export function MetricCard({
  eyebrow,
  value,
  helper,
}: {
  eyebrow: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="stat-card dashboard-metric-card">
      <p className="eyebrow">{eyebrow}</p>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>{value}</h2>
      <p className="muted" style={{ margin: 0 }}>
        {helper}
      </p>
    </article>
  );
}
