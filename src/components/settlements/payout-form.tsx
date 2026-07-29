"use client";

import { useActionState, useState } from "react";
import { FormFeedback } from "@/components/ui/form-feedback";
import { savePartnerPayout } from "@/features/settlements/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type { PartnerMonthlyResultRecord } from "@/features/settlements/types";
import { formatCurrency } from "@/lib/utils/format";

function todayDateValue() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;

  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function formatNumberInputValue(value: unknown) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "";
}

export function PayoutForm({
  result,
  canEdit,
}: {
  result: PartnerMonthlyResultRecord;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(savePartnerPayout, initialFormState);
  const defaultPaidAmount =
    result.payout_status === "pending"
      ? (result.paid_amount ?? "")
      : (result.paid_amount ?? result.partner_amount);
  const totalDueValue = formatNumberInputValue(result.partner_amount);
  const [paidAmount, setPaidAmount] = useState(String(defaultPaidAmount));

  return (
    <form action={formAction} className="payout-form">
      <input name="payoutId" type="hidden" value={result.payout_id ?? ""} />
      <input name="runId" type="hidden" value={result.calculation_run_id} />
      <input
        name="existingAttachmentPath"
        type="hidden"
        value={result.payment_attachment_path ?? ""}
      />
      <label className="field">
        <span>Paid amount</span>
        <div className="payout-amount-control">
          <input
            disabled={!canEdit || !result.payout_id}
            name="paidAmount"
            onChange={(event) => setPaidAmount(event.target.value)}
            step="0.01"
            type="number"
            value={paidAmount}
          />
          <button
            className="secondary-button"
            disabled={!canEdit || !result.payout_id}
            onClick={() => setPaidAmount(totalDueValue)}
            type="button"
          >
            Use total
          </button>
        </div>
        <small className="muted">Total due: {formatCurrency(result.partner_amount)}</small>
      </label>
      <label className="field">
        <span>Paid at</span>
        <input
          defaultValue={result.paid_at ?? todayDateValue()}
          disabled={!canEdit || !result.payout_id}
          name="paidAt"
          type="date"
        />
      </label>
      <label className="field">
        <span>Method</span>
        <input
          defaultValue={result.payment_method ?? ""}
          disabled={!canEdit || !result.payout_id}
          name="paymentMethod"
        />
      </label>
      <label className="field">
        <span>Note</span>
        <input
          defaultValue={result.payment_note ?? ""}
          disabled={!canEdit || !result.payout_id}
          name="paymentNote"
        />
      </label>
      <label className="field">
        <span>Attachment</span>
        <input disabled={!canEdit || !result.payout_id} name="paymentAttachment" type="file" />
      </label>
      {result.payment_attachment_path && canEdit && (
        <label>
          <input
            defaultChecked={false}
            disabled={!result.payout_id}
            name="removeAttachment"
            type="checkbox"
            value="true"
          />{" "}
          Remove current attachment
        </label>
      )}
      {canEdit && result.payout_id && (
        <button className="secondary-button" type="submit">
          Save payment
        </button>
      )}
      <FormFeedback message={state.error} tone="error" />
      <FormFeedback message={state.message} tone="success" />
    </form>
  );
}
