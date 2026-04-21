import { z } from "zod";

const nullableNumberField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return value;
}, z.coerce.number().nullable());

export const importRowUpdateSchema = z.object({
  rowId: z.string().uuid(),
  yearValue: nullableNumberField.pipe(z.number().int().nullable()),
  makeValue: z.string().trim().min(1, "Make is required."),
  modelValue: z.string().trim().min(1, "Model is required."),
  vinValue: z.string().trim().min(1, "VIN is required."),
  saleValue: nullableNumberField,
  financeRaw: z.string().trim().min(1, "Finance is required."),
  netGrossValue: nullableNumberField,
  pickupValue: nullableNumberField,
});

export const importReviewActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_row"),
    payload: importRowUpdateSchema,
  }),
  z.object({
    action: z.literal("approve_row"),
    rowId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("reject_row"),
    rowId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("approve_ready_rows"),
  }),
]);

export type ImportReviewActionInput = z.infer<typeof importReviewActionSchema>;
