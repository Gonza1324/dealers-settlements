export function StatusPill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "muted";
}) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
