import { z } from "zod";

const optionalIdField = z.string().uuid().optional().or(z.literal("")).default("");
const requiredDateField = z.preprocess((value) => {
  return typeof value === "string" ? value.trim() : value;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required."));

export const deadDealFiltersSchema = z.object({
  periodMonth: z.string().optional().default(""),
  dealerId: optionalIdField,
  financierId: optionalIdField,
  vin: z.string().optional().default(""),
});

export const deadDealSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")).default(""),
  dealerId: z.string().uuid("Dealer is required."),
  financierId: z.string().uuid("Financier is required."),
  deadDealDate: requiredDateField,
  vinValue: z.string().trim().min(1, "VIN is required."),
  netGrossValue: z.coerce.number().min(0, "Net gross must be zero or greater."),
});

export const deadDealDeleteSchema = z.object({
  deadDealId: z.string().uuid(),
});
