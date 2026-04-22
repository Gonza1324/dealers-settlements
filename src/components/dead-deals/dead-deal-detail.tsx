import type { DeadDealListRecord } from "@/features/dead-deals/types";

export function DeadDealDetail({
  deadDeal,
}: {
  deadDeal: DeadDealListRecord;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Dead deal summary</p>
      <h2 style={{ marginTop: 0 }}>{deadDeal.vin_value}</h2>
      <div className="grid two">
        <div>
          <p className="eyebrow">Dealer</p>
          <p style={{ margin: 0 }}>
            {deadDeal.dealer_name} ({deadDeal.dealer_code})
          </p>
        </div>
        <div>
          <p className="eyebrow">Financier</p>
          <p style={{ margin: 0 }}>{deadDeal.financier_name}</p>
        </div>
        <div>
          <p className="eyebrow">Date</p>
          <p style={{ margin: 0 }}>{deadDeal.dead_deal_date}</p>
        </div>
        <div>
          <p className="eyebrow">Period month</p>
          <p style={{ margin: 0 }}>{deadDeal.period_month}</p>
        </div>
        <div>
          <p className="eyebrow">Net gross</p>
          <p style={{ margin: 0 }}>{deadDeal.net_gross_value}</p>
        </div>
        <div>
          <p className="eyebrow">Commission</p>
          <p style={{ margin: 0 }}>{deadDeal.commission_amount}</p>
        </div>
        <div>
          <p className="eyebrow">Dealer profit</p>
          <p style={{ margin: 0 }}>{deadDeal.dealer_profit}</p>
        </div>
      </div>
    </section>
  );
}
