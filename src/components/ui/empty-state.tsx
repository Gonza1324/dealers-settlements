import Link from "next/link";

export function EmptyState({
  actionHref,
  actionLabel,
  title,
  description,
}: {
  actionHref?: string;
  actionLabel?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="empty-state">
      <p className="eyebrow">No data</p>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p className="muted" style={{ marginBottom: 0 }}>
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link className="ghost-button empty-state-action" href={actionHref}>
          {actionLabel}
        </Link>
      )}
    </section>
  );
}
