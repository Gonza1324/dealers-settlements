"use client";

import { useActionState } from "react";
import { saveDeadDeal } from "@/features/dead-deals/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type { DeadDealListRecord } from "@/features/dead-deals/types";

export function DeadDealForm({
  canEdit,
  dealers,
  financiers,
  deadDeal,
}: {
  canEdit: boolean;
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<{ id: string; name: string }>;
  deadDeal?: DeadDealListRecord;
}) {
  const [state, formAction] = useActionState(saveDeadDeal, initialFormState);

  return (
    <section className="panel">
      <p className="eyebrow">{deadDeal ? "Dead deal detail" : "Manual load"}</p>
      <h2 style={{ marginTop: 0 }}>
        {deadDeal ? `Dead deal ${deadDeal.vin_value}` : "Create a dead deal"}
      </h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Commission is fixed at 20% for the financier. Dealer profit is net gross minus that commission.
      </p>

      <form action={formAction} className="masters-form">
        <input name="id" type="hidden" value={deadDeal?.id ?? ""} />
        <label className="field">
          <span>Dealer</span>
          <select defaultValue={deadDeal?.dealer_id ?? ""} disabled={!canEdit} name="dealerId">
            <option value="">Select dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name} ({dealer.code})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Financier</span>
          <select
            defaultValue={deadDeal?.financier_id ?? ""}
            disabled={!canEdit}
            name="financierId"
          >
            <option value="">Select financier</option>
            {financiers.map((financier) => (
              <option key={financier.id} value={financier.id}>
                {financier.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Manual date</span>
          <input
            defaultValue={deadDeal?.dead_deal_date ?? ""}
            disabled={!canEdit}
            name="deadDealDate"
            type="date"
          />
        </label>
        <label className="field">
          <span>VIN</span>
          <input defaultValue={deadDeal?.vin_value ?? ""} disabled={!canEdit} name="vinValue" />
        </label>
        <label className="field">
          <span>Net gross</span>
          <input
            defaultValue={deadDeal?.net_gross_value ?? ""}
            disabled={!canEdit}
            name="netGrossValue"
            step="0.01"
            type="number"
          />
        </label>
        <div className="inline-alert" style={{ gridColumn: "1 / -1" }}>
          <p className="eyebrow">Calculated by database</p>
          <p style={{ margin: "0 0 6px" }}>
            Commission: {deadDeal?.commission_amount ?? "20% of net gross"}
          </p>
          <p style={{ margin: 0 }}>
            Dealer profit: {deadDeal?.dealer_profit ?? "Net gross minus commission"}
          </p>
        </div>
        {canEdit && (
          <button className="action-button" type="submit">
            {deadDeal ? "Save dead deal" : "Create dead deal"}
          </button>
        )}
        {state.error && <p className="error-text">{state.error}</p>}
        {state.message && <p className="success-text">{state.message}</p>}
      </form>
    </section>
  );
}
