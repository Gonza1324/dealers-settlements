"use client";

import { useActionState } from "react";
import { saveDealManualEdit } from "@/features/deals/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type { DealListRecord } from "@/features/deals/types";

export function DealEditForm({
  deal,
  dealers,
  financiers,
  canEdit,
}: {
  deal: DealListRecord;
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<{ id: string; name: string }>;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(saveDealManualEdit, initialFormState);

  return (
    <section className="panel">
      <p className="eyebrow">Deal detail</p>
      <h2 style={{ marginTop: 0 }}>
        {deal.year_value ?? "-"} {deal.make_value} {deal.model_value}
      </h2>
      <p className="muted">VIN {deal.vin_value}</p>

      <form action={formAction} className="masters-form">
        <input name="id" type="hidden" value={deal.id} />
        <label className="field">
          <span>Dealer</span>
          <select defaultValue={deal.dealer_id} disabled={!canEdit} name="dealerId">
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
            defaultValue={deal.financier_id ?? ""}
            disabled={!canEdit}
            name="financierId"
          >
            <option value="">No financier</option>
            {financiers.map((financier) => (
              <option key={financier.id} value={financier.id}>
                {financier.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Period month</span>
          <input defaultValue={deal.period_month} disabled={!canEdit} name="periodMonth" type="date" />
        </label>
        <label className="field">
          <span>Year</span>
          <input defaultValue={deal.year_value ?? ""} disabled={!canEdit} name="yearValue" type="number" />
        </label>
        <label className="field">
          <span>Make</span>
          <input defaultValue={deal.make_value} disabled={!canEdit} name="makeValue" />
        </label>
        <label className="field">
          <span>Model</span>
          <input defaultValue={deal.model_value} disabled={!canEdit} name="modelValue" />
        </label>
        <label className="field">
          <span>VIN</span>
          <input defaultValue={deal.vin_value} disabled={!canEdit} name="vinValue" />
        </label>
        <label className="field">
          <span>Sale date</span>
          <input defaultValue={deal.sale_value} disabled={!canEdit} name="saleValue" type="date" />
        </label>
        <label className="field">
          <span>Net gross value</span>
          <input
            defaultValue={deal.net_gross_value}
            disabled={!canEdit}
            name="netGrossValue"
            step="0.01"
            type="number"
          />
        </label>
        <label className="field">
          <span>Pickup value</span>
          <input defaultValue={deal.pickup_value} disabled={!canEdit} name="pickupValue" step="0.01" type="number" />
        </label>
        <div className="inline-alert" style={{ gridColumn: "1 / -1" }}>
          <p className="eyebrow">Calculated by database</p>
          <p style={{ margin: "0 0 6px" }}>Commission: {deal.commission_amount}</p>
          <p style={{ margin: 0 }}>Deal profit: {deal.deal_profit}</p>
        </div>
        {canEdit && (
          <button className="action-button" type="submit">
            Save manual changes
          </button>
        )}
        {state.error && <p className="error-text">{state.error}</p>}
        {state.message && <p className="success-text">{state.message}</p>}
      </form>

      <div className="grid two" style={{ marginTop: 20 }}>
        <div>
          <p className="eyebrow">Original payload</p>
          <pre className="payload-block">
            {JSON.stringify(deal.original_payload, null, 2)}
          </pre>
        </div>
        <div>
          <p className="eyebrow">Current payload</p>
          <pre className="payload-block">
            {JSON.stringify(deal.current_payload, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
