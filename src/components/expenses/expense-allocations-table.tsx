import { DataTable } from "@/components/ui/data-table";
import type { ExpenseAllocationRecord } from "@/features/expenses/types";

export function ExpenseAllocationsTable({
  allocations,
}: {
  allocations: ExpenseAllocationRecord[];
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Allocations</p>
      <h2 style={{ marginTop: 0 }}>Dealer allocations</h2>
      <DataTable
        columns={[
          { key: "dealer", label: "Dealer" },
          { key: "code", label: "Code" },
          { key: "amount", label: "Allocated amount" },
        ]}
      >
        {allocations.map((allocation) => (
          <tr key={allocation.id}>
            <td>{allocation.dealer_name}</td>
            <td>{allocation.dealer_code}</td>
            <td>{allocation.allocated_amount}</td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
