interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: PageHeaderProps) {
  return (
    <section className="hero-card" style={{ marginBottom: 24 }}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="title">{title}</h1>
      <p className="subtitle" style={{ maxWidth: 760 }}>
        {description}
      </p>
    </section>
  );
}

