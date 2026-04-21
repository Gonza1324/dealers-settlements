import { z } from "zod";

const nullableNumberField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return value;
}, z.coerce.number().nullable());

const requiredMonthField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  return trimmed;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Period month is required."));

const requiredDateField = z.preprocess((value) => {
  return typeof value === "string" ? value.trim() : value;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sale date is required."));

const dealWriteShape = {
  dealerId: z.string().uuid("Dealer is required."),
  financierId: z.string().uuid().optional().or(z.literal("")).default(""),
  periodMonth: requiredMonthField,
  yearValue: nullableNumberField.pipe(z.number().int().nullable()),
  makeValue: z.string().trim().min(1, "Make is required."),
  modelValue: z.string().trim().min(1, "Model is required."),
  vinValue: z.string().trim().min(1, "VIN is required."),
  saleValue: requiredDateField,
  netGrossValue: z.coerce.number(),
  pickupValue: nullableNumberField,
};

export const dealFiltersSchema = z.object({
  periodMonth: z.string().optional().default(""),
  dealerId: z.string().uuid().optional().or(z.literal("")).default(""),
  financierId: z.string().uuid().optional().or(z.literal("")).default(""),
  vin: z.string().optional().default(""),
  make: z.string().optional().default(""),
  model: z.string().optional().default(""),
  isManuallyEdited: z
    .enum(["all", "yes", "no"])
    .optional()
    .default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const consolidateRowsSchema = z.object({
  importFileId: z.string().uuid(),
  rowIds: z.array(z.string().uuid()).min(1, "Select at least one row."),
});

export const dealManualCreateSchema = z.object(dealWriteShape);

export const dealManualEditSchema = z.object({
  id: z.string().uuid(),
  ...dealWriteShape,
});
