import type { PaymentStatus } from "@/types/database";
import type { StatusPillTone } from "@/components/ui/status-pill";

export function resolvePayoutStatusFromAmounts({
  paidAmount,
  storedStatus,
  totalAmount,
}: {
  paidAmount: number | null;
  storedStatus?: PaymentStatus | null;
  totalAmount: number;
}): PaymentStatus {
  if (storedStatus === "pending" || paidAmount === null || paidAmount <= 0) {
    return "pending";
  }

  if (totalAmount > 0 && paidAmount < totalAmount) {
    return "partial";
  }

  return "paid";
}

export function payoutStatusTone(status: PaymentStatus): StatusPillTone {
  if (status === "paid") {
    return "success";
  }

  if (status === "partial") {
    return "info";
  }

  return "warning";
}
