import type { StatusPillTone } from "@/components/ui/status-pill";

export type ReadinessSeverity = "critical" | "warning" | "info";
export type ReadinessCategory =
  | "Data quality"
  | "Partner shares"
  | "Expenses"
  | "Settlements"
  | "Payouts";

export type ReadinessAlert = {
  category: ReadinessCategory;
  ctaHref: string;
  ctaLabel: string;
  description: string;
  id: string;
  severity: ReadinessSeverity;
  title: string;
};

export type ReadinessCheck = {
  count: number;
  description: string;
  label: string;
  tone: StatusPillTone;
};

export type ReadinessPeriodOption = {
  label: string;
  value: string;
};

export type ReadinessSummary = {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  readinessScore: number;
  totalAlerts: number;
};

export type ReadinessPageData = {
  alerts: ReadinessAlert[];
  checks: ReadinessCheck[];
  periodOptions: ReadinessPeriodOption[];
  selectedPeriodMonth: string;
  summary: ReadinessSummary;
};
