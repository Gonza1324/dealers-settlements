export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="panel empty-state">
      <p className="eyebrow">No data</p>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p className="muted" style={{ marginBottom: 0 }}>
        {description}
      </p>
    </section>
  );
}
