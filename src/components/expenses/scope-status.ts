import type { StatusPillTone } from "@/components/ui/status-pill";

export function expenseScopeTone(scopeType: string | null | undefined): StatusPillTone {
  if (scopeType === "single_dealer") {
    return "success";
  }

  if (scopeType === "selected_dealers") {
    return "warning";
  }

  if (scopeType === "all_dealers") {
    return "danger";
  }

  return "muted";
}
