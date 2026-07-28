export type StatusPillTone = "success" | "warning" | "danger" | "info" | "muted";

export function StatusPill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: StatusPillTone;
}) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
