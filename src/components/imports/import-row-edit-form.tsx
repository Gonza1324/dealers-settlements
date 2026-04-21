"use client";

import { useState } from "react";
import type { ImportNormalizedPayload, ImportRowReview } from "@/features/imports/types";

type EditableFields = {
  yearValue: string;
  makeValue: string;
  modelValue: string;
  vinValue: string;
  saleValue: string;
  financeRaw: string;
  netGrossValue: string;
  pickupValue: string;
};

function buildInitialState(payload: ImportNormalizedPayload): EditableFields {
  return {
    yearValue: payload.yearValue === null ? "" : String(payload.yearValue),
    makeValue: payload.makeValue ?? "",
    modelValue: payload.modelValue ?? "",
    vinValue: payload.vinValue ?? "",
    saleValue: payload.saleValue === null ? "" : String(payload.saleValue),
    financeRaw: payload.financeRaw ?? "",
    netGrossValue:
      payload.netGrossValue === null ? "" : String(payload.netGrossValue),
    pickupValue: String(payload.pickupValue ?? 0),
  };
}

export function ImportRowEditForm({
  row,
  isSaving,
  onCancel,
  onSave,
}: {
  row: ImportRowReview;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: {
    rowId: string;
    yearValue: number | null;
    makeValue: string;
    modelValue: string;
    vinValue: string;
    saleValue: number | null;
    financeRaw: string;
    netGrossValue: number | null;
    pickupValue: number | null;
  }) => Promise<void>;
}) {
  const [fields, setFields] = useState<EditableFields>(() =>
    buildInitialState(row.normalizedPayload),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSave({
      rowId: row.id,
      yearValue: fields.yearValue ? Number(fields.yearValue) : null,
      makeValue: fields.makeValue,
      modelValue: fields.modelValue,
      vinValue: fields.vinValue,
      saleValue: fields.saleValue ? Number(fields.saleValue) : null,
      financeRaw: fields.financeRaw,
      netGrossValue: fields.netGrossValue ? Number(fields.netGrossValue) : null,
      pickupValue: fields.pickupValue ? Number(fields.pickupValue) : null,
    });
  }

  return (
    <form className="import-edit-form" onSubmit={handleSubmit}>
      <div className="grid four">
        <label className="field">
          <span>Year</span>
          <input
            value={fields.yearValue}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                yearValue: event.target.value,
              }))
            }
          />
        </label>
        <label className="field">
          <span>Make</span>
          <input
            value={fields.makeValue}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                makeValue: event.target.value,
              }))
            }
          />
        </label>
        <label className="field">
          <span>Model</span>
          <input
            value={fields.modelValue}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                modelValue: event.target.value,
              }))
            }
          />
        </label>
        <label className="field">
          <span>VIN</span>
          <input
            value={fields.vinValue}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                vinValue: event.target.value.toUpperCase(),
              }))
            }
          />
        </label>
        <label className="field">
          <span>Sale</span>
          <input
            value={fields.saleValue}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                saleValue: event.target.value,
              }))
            }
          />
        </label>
        <label className="field">
          <span>Finance</span>
          <input
            value={fields.financeRaw}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                financeRaw: event.target.value,
              }))
            }
          />
        </label>
        <label className="field">
          <span>Net Gross</span>
          <input
            value={fields.netGrossValue}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                netGrossValue: event.target.value,
              }))
            }
          />
        </label>
        <label className="field">
          <span>Pick Up</span>
          <input
            value={fields.pickupValue}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                pickupValue: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="import-row-actions">
        <button className="action-button" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        <button
          className="secondary-button"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
