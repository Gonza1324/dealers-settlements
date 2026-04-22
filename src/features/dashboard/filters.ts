import type { DashboardFilters } from "@/features/dashboard/types";

function readString(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function parseDashboardFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DashboardFilters {
  const paymentStatus = readString(searchParams.paymentStatus);

  return {
    periodMonth: readString(searchParams.periodMonth, currentMonth()),
    dealerId: readString(searchParams.dealerId),
    financierId: readString(searchParams.financierId),
    paymentStatus:
      paymentStatus === "pending" || paymentStatus === "paid"
        ? paymentStatus
        : "",
  };
}
