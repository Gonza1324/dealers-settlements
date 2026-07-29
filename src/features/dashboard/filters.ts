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

export function parseDashboardFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DashboardFilters {
  const paymentStatus = readString(searchParams.paymentStatus);

  return {
    periodMonth: readString(searchParams.periodMonth),
    dealerId: readString(searchParams.dealerId),
    financierId: readString(searchParams.financierId),
    paymentStatus:
      paymentStatus === "pending" ||
      paymentStatus === "partial" ||
      paymentStatus === "paid"
        ? paymentStatus
        : "",
  };
}
