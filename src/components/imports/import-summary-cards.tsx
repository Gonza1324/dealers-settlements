import type { ImportReviewSummary } from "@/features/imports/types";

export function ImportSummaryCards({
  summary,
}: {
  summary: ImportReviewSummary;
}) {
  const cards = [
    { label: "Rows", value: summary.totalRows },
    { label: "Rows with errors", value: summary.rowsWithErrors },
    { label: "Rows with warnings", value: summary.rowsWithWarnings },
    { label: "Duplicates", value: summary.duplicateRows },
  ];

  return (
    <section className="grid four" style={{ marginBottom: 24 }}>
      {cards.map((card) => (
        <article key={card.label} className="stat-card">
          <p className="eyebrow">{card.label}</p>
          <h2 style={{ margin: 0, fontSize: 28 }}>{card.value}</h2>
        </article>
      ))}
      <article className="stat-card">
        <p className="eyebrow">Consolidation</p>
        <h2 style={{ margin: 0, fontSize: 22 }}>
          {summary.canProceedToConsolidation ? "Ready later" : "Blocked"}
        </h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          Consolidation is intentionally deferred to the next phase.
        </p>
      </article>
    </section>
  );
}
