"use client";

import { useActionState } from "react";
import { FormFeedback } from "@/components/ui/form-feedback";
import { executeMonthlyCalculation } from "@/features/settlements/actions";
import { initialFormState } from "@/features/masters/shared/form-state";

export function SettlementsControls({
  canRun,
  periodMonth,
}: {
  canRun: boolean;
  periodMonth: string;
}) {
  const [state, formAction] = useActionState(
    executeMonthlyCalculation,
    initialFormState,
  );

  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <form action={formAction} className="masters-form">
        <div className="grid two">
          <label className="field">
            <span>Period month</span>
            <input defaultValue={periodMonth} name="periodMonth" type="month" />
          </label>
          <label className="field">
            <span>Notes</span>
            <input name="notes" placeholder="Optional run note" />
          </label>
        </div>
        <div className="table-actions">
          <button className="action-button" disabled={!canRun} type="submit">
            Run monthly calculation
          </button>
        </div>
        <FormFeedback message={state.error} tone="error" />
        <FormFeedback message={state.message} tone={state.success ? "success" : "warning"} />
      </form>
    </section>
  );
}
