import type { MonthlyCalculationRunRecord } from "@/features/settlements/types";

export function RunSummary({
  run,
}: {
  run: MonthlyCalculationRunRecord;
}) {
  return (
    <section className="grid four" style={{ marginBottom: 24 }}>
      <article className="stat-card">
        <p className="eyebrow">Dealers calculated</p>
        <h2 style={{ margin: 0 }}>{run.summary_json.dealersCalculated}</h2>
      </article>
      <article className="stat-card">
        <p className="eyebrow">Partners calculated</p>
        <h2 style={{ margin: 0 }}>{run.summary_json.partnersCalculated}</h2>
      </article>
      <article className="stat-card">
        <p className="eyebrow">Net total</p>
        <h2 style={{ margin: 0 }}>{run.summary_json.netTotal}</h2>
      </article>
      <article className="stat-card">
        <p className="eyebrow">Errors</p>
        <h2 style={{ margin: 0 }}>{run.summary_json.errorCount}</h2>
      </article>
    </section>
  );
}
