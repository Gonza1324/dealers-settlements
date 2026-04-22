import type { MonthlyComparisonPoint } from "@/features/dashboard/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function MonthlyComparisonCard({
  points,
}: {
  points: MonthlyComparisonPoint[];
}) {
  const maxValue = Math.max(...points.map((point) => Math.abs(point.netProfitTotal)), 1);

  return (
    <section className="panel">
      <p className="eyebrow">Monthly comparison</p>
      <h2 style={{ marginTop: 0 }}>Net evolution</h2>
      <p className="muted">
        Current-run monthly net profit trend for the visible dealers.
      </p>

      {points.length === 0 ? (
        <p className="muted" style={{ marginBottom: 0 }}>
          No monthly comparison data available yet.
        </p>
      ) : (
        <div className="comparison-chart">
          {points.map((point) => (
            <div className="comparison-row" key={point.periodMonth}>
              <div className="comparison-meta">
                <strong>{point.periodMonth.slice(0, 7)}</strong>
                <span>{formatCurrency(point.netProfitTotal)}</span>
              </div>
              <div className="comparison-bar-track">
                <div
                  className={`comparison-bar ${
                    point.netProfitTotal >= 0 ? "positive" : "negative"
                  }`}
                  style={{
                    width: `${Math.max(
                      8,
                      Math.round((Math.abs(point.netProfitTotal) / maxValue) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
