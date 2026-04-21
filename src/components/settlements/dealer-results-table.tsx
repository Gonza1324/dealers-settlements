import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { DealerMonthlyResultRecord } from "@/features/settlements/types";

export function DealerResultsTable({
  results,
}: {
  results: DealerMonthlyResultRecord[];
}) {
  if (results.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="No dealer results"
          description="This run did not generate dealer-level calculations for your current scope."
        />
      </section>
    );
  }

  return (
    <section className="panel">
      <p className="eyebrow">Dealer view</p>
      <h2 style={{ marginTop: 0 }}>Dealer monthly results</h2>
      <DataTable
        columns={[
          { key: "dealer", label: "Dealer" },
          { key: "gross", label: "Gross profit" },
          { key: "expenses", label: "Expenses" },
          { key: "net", label: "Net profit" },
        ]}
      >
        {results.map((result) => (
          <tr key={result.id}>
            <td>
              {result.dealer_name}
              <div className="small-text muted">Code {result.dealer_code}</div>
            </td>
            <td>{result.gross_profit_total}</td>
            <td>{result.expense_total}</td>
            <td>{result.net_profit_total}</td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
