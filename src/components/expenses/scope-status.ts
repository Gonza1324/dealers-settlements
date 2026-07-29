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

export function formatExpenseScope(scopeType: string | null | undefined) {
  if (scopeType === "single_dealer") {
    return "Single dealer";
  }

  if (scopeType === "selected_dealers") {
    return "Selected dealers";
  }

  if (scopeType === "all_dealers") {
    return "All dealers";
  }

  return "Unknown scope";
}
