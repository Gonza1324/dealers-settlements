import type {
  ExpenseAllocationDraft,
  ExpenseTargetDealer,
} from "@/features/expenses/types";
import type { ExpenseScopeType } from "@/types/database";

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function buildExpenseAllocations(params: {
  amount: number;
  scopeType: ExpenseScopeType;
  dealers: ExpenseTargetDealer[];
}): ExpenseAllocationDraft[] {
  if (params.dealers.length === 0) {
    return [];
  }

  if (params.scopeType === "single_dealer") {
    return [
      {
        dealerId: params.dealers[0].id,
        allocatedAmount: Number(params.amount.toFixed(2)),
      },
    ];
  }

  const totalCents = toCents(params.amount);
  const baseCents = Math.floor(totalCents / params.dealers.length);
  const remainder = totalCents - baseCents * params.dealers.length;

  return params.dealers.map((dealer, index) => {
    const cents =
      index === params.dealers.length - 1 ? baseCents + remainder : baseCents;

    return {
      dealerId: dealer.id,
      allocatedAmount: cents / 100,
    };
  });
}
