export function MetricCard({
  eyebrow,
  value,
  helper,
  featured = false,
}: {
  eyebrow: string;
  value: string;
  helper: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`stat-card dashboard-metric-card${featured ? " featured" : ""}`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <div className="dashboard-metric-value">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>{value}</h2>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        {helper}
      </p>
    </article>
  );
}
