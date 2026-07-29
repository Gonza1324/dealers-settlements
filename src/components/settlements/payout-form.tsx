"use client";

import { useActionState } from "react";
import { savePartnerPayout } from "@/features/settlements/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type { PartnerMonthlyResultRecord } from "@/features/settlements/types";
import { formatCurrency } from "@/lib/utils/format";

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
        <span>Status</span>
        <select
          defaultValue={result.payout_status}
          disabled={!canEdit || !result.payout_id}
          name="paymentStatus"
        >
          <option value="pending">pending</option>
          <option value="partial">partial</option>
          <option value="paid">paid</option>
        </select>
      </label>
      <label className="field">
        <span>Paid amount</span>
        <input
          defaultValue={defaultPaidAmount}
          disabled={!canEdit || !result.payout_id}
          name="paidAmount"
          step="0.01"
          type="number"
        />
        <small className="muted">Total due: {formatCurrency(result.partner_amount)}</small>
      </label>
      <label className="field">
        <span>Paid at</span>
        <input
          defaultValue={result.paid_at ?? ""}
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
      {state.error && <p className="error-text">{state.error}</p>}
      {state.message && <p className="success-text">{state.message}</p>}
    </form>
  );
}
