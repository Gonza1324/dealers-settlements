"use client";

import { useActionState } from "react";
import { createManualDeal } from "@/features/deals/actions";
import { initialFormState } from "@/features/masters/shared/form-state";

export function DealCreateForm({
  canCreate,
  dealers,
  financiers,
}: {
  canCreate: boolean;
  dealers: Array<{ id: string; name: string; code: number }>;
  financiers: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState(createManualDeal, initialFormState);

  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <p className="eyebrow">Manual load</p>
      <h2 style={{ marginTop: 0 }}>Create a deal manually</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Use the same business fields required by CSV imports and create a consolidated deal directly.
      </p>

      <form action={formAction} className="masters-form">
        <div className="grid two">
          <label className="field">
            <span>Dealer</span>
            <select defaultValue="" disabled={!canCreate} name="dealerId">
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
            <select defaultValue="" disabled={!canCreate} name="financierId">
              <option value="">Select financier</option>
              {financiers.map((financier) => (
                <option key={financier.id} value={financier.id}>
                  {financier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Period month</span>
            <input disabled={!canCreate} name="periodMonth" type="month" />
          </label>
          <label className="field">
            <span>Year</span>
            <input disabled={!canCreate} name="yearValue" type="number" />
          </label>
          <label className="field">
            <span>Make</span>
            <input disabled={!canCreate} name="makeValue" />
          </label>
          <label className="field">
            <span>Model</span>
            <input disabled={!canCreate} name="modelValue" />
          </label>
          <label className="field">
            <span>VIN</span>
            <input disabled={!canCreate} name="vinValue" />
          </label>
          <label className="field">
            <span>Sale date</span>
            <input disabled={!canCreate} name="saleValue" type="date" />
          </label>
          <label className="field">
            <span>Net gross value</span>
            <input disabled={!canCreate} name="netGrossValue" step="0.01" type="number" />
          </label>
          <label className="field">
            <span>Pickup value</span>
            <input disabled={!canCreate} name="pickupValue" step="0.01" type="number" />
          </label>
        </div>
        <div className="inline-alert" style={{ marginTop: 4 }}>
          <p style={{ margin: 0 }}>
            Commission and deal profit will be calculated automatically by the database after save.
          </p>
        </div>
        <div className="table-actions">
          <button className="action-button" disabled={!canCreate} type="submit">
            Create manual deal
          </button>
        </div>
        {state.error && <p className="error-text">{state.error}</p>}
        {state.message && <p className="success-text">{state.message}</p>}
      </form>
    </section>
  );
}
