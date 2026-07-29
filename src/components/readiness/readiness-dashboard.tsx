import Link from "next/link";
import { StatusPill, type StatusPillTone } from "@/components/ui/status-pill";
import type {
  ReadinessAlert,
  ReadinessPageData,
  ReadinessSeverity,
} from "@/features/readiness/types";

function alertTone(severity: ReadinessSeverity): StatusPillTone {
  if (severity === "critical") {
    return "danger";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "info";
}

function readinessTone(score: number): StatusPillTone {
  if (score >= 85) {
    return "success";
  }

  if (score >= 65) {
    return "warning";
  }

  return "danger";
}

function AlertCard({ alert }: { alert: ReadinessAlert }) {
  return (
    <article className={`readiness-alert ${alert.severity}`}>
      <div>
        <div className="readiness-alert-header">
          <StatusPill tone={alertTone(alert.severity)}>{alert.severity}</StatusPill>
          <span className="muted small-text">{alert.category}</span>
        </div>
        <h3>{alert.title}</h3>
        <p className="muted">{alert.description}</p>
      </div>
      <Link className="ghost-button" href={alert.ctaHref}>
        {alert.ctaLabel}
      </Link>
    </article>
  );
}

export function ReadinessDashboard({ data }: { data: ReadinessPageData }) {
  return (
    <>
      <section className="panel filter-panel">
        <div className="filter-panel-header">
          <div>
            <p className="eyebrow">Settlement readiness</p>
            <h2>Pre-settlement operations review</h2>
          </div>
          <div className="filter-summary">
            {data.summary.totalAlerts === 0
              ? "No exceptions detected"
              : `${data.summary.totalAlerts} exceptions`}
          </div>
        </div>
        <form action="/readiness" className="filter-form-grid compact" method="get">
          <label className="field">
            <span>Period month</span>
            <select defaultValue={data.selectedPeriodMonth} name="periodMonth">
              {data.periodOptions.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
              {data.periodOptions.length === 0 && (
                <option value={data.selectedPeriodMonth}>{data.selectedPeriodMonth}</option>
              )}
            </select>
          </label>
          <div className="filter-panel-actions">
            <button className="action-button" type="submit">
              Review period
            </button>
            <Link className="ghost-button" href="/readiness">
              Latest
            </Link>
          </div>
        </form>
      </section>

      <section className="readiness-score-grid">
        <article className="stat-card readiness-score-card">
          <p className="eyebrow">Readiness score</p>
          <div className="readiness-score-value">
            <h2>{data.summary.readinessScore}</h2>
            <StatusPill tone={readinessTone(data.summary.readinessScore)}>
              {data.summary.readinessScore >= 85
                ? "ready"
                : data.summary.readinessScore >= 65
                  ? "needs review"
                  : "blocked"}
            </StatusPill>
          </div>
          <p className="muted">
            Score reflects critical, warning and informational exceptions in the selected period.
          </p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Critical</p>
          <h2 style={{ marginTop: 0 }}>{data.summary.criticalCount}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Blocks or high-risk issues before settlement.
          </p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Warnings</p>
          <h2 style={{ marginTop: 0 }}>{data.summary.warningCount}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Operational items that should be reviewed.
          </p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Info</p>
          <h2 style={{ marginTop: 0 }}>{data.summary.infoCount}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Useful context that may affect follow-up.
          </p>
        </article>
      </section>

      <section className="grid four readiness-check-grid">
        {data.checks.map((check) => (
          <article className="dashboard-mini-card" key={check.label}>
            <div className="readiness-check-header">
              <span className="muted">{check.label}</span>
              <StatusPill tone={check.tone}>{check.tone}</StatusPill>
            </div>
            <strong>{check.count}</strong>
            <p className="muted">{check.description}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="dashboard-card-header">
          <div>
            <p className="eyebrow">Exceptions dashboard</p>
            <h2>Issues to resolve</h2>
          </div>
          <Link className="ghost-button" href={`/settlements?periodMonth=${data.selectedPeriodMonth}`}>
            Open settlements
          </Link>
        </div>

        {data.alerts.length > 0 ? (
          <div className="readiness-alert-list">
            {data.alerts.map((alert) => (
              <AlertCard alert={alert} key={alert.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">Clean period</p>
            <h2>No exceptions detected</h2>
            <p className="muted">
              This period has no blocking readiness issues based on current operational checks.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
