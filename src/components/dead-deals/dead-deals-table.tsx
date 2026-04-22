import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { DeadDealListRecord } from "@/features/dead-deals/types";

export function DeadDealsTable({
  deadDeals,
}: {
  deadDeals: DeadDealListRecord[];
}) {
  if (deadDeals.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="No dead deals found"
          description="Try another month, dealer, financier, or VIN filter."
        />
      </section>
    );
  }

  return (
    <section className="panel">
      <p className="eyebrow">Dead deals</p>
      <h2 style={{ marginTop: 0 }}>Manual dead deal records</h2>
      <DataTable
        columns={[
          { key: "date", label: "Date" },
          { key: "dealer", label: "Dealer" },
          { key: "financier", label: "Financier" },
          { key: "vin", label: "VIN" },
          { key: "netGross", label: "Net gross" },
          { key: "commission", label: "Commission" },
          { key: "profit", label: "Dealer profit" },
          { key: "actions", label: "Actions" },
        ]}
      >
        {deadDeals.map((deadDeal) => (
          <tr key={deadDeal.id}>
            <td>
              {deadDeal.dead_deal_date}
              <div className="small-text muted">Month {deadDeal.period_month}</div>
            </td>
            <td>
              {deadDeal.dealer_name}
              <div className="small-text muted">Code {deadDeal.dealer_code}</div>
            </td>
            <td>{deadDeal.financier_name}</td>
            <td>{deadDeal.vin_value}</td>
            <td>{deadDeal.net_gross_value}</td>
            <td>{deadDeal.commission_amount}</td>
            <td>{deadDeal.dealer_profit}</td>
            <td>
              <Link className="ghost-button" href={`/dead-deals/${deadDeal.id}`}>
                View detail
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
