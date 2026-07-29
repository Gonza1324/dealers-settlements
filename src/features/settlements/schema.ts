import { z } from "zod";

const requiredMonthField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  return trimmed;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Month is required."));

export const settlementFiltersSchema = z.object({
  periodMonth: z.string().optional().default(""),
});

export const runMonthlyCalculationSchema = z.object({
  periodMonth: requiredMonthField,
  notes: z.string().trim().optional().default(""),
});

export const settlementPayoutSchema = z
  .object({
    payoutId: z.string().uuid(),
    runId: z.string().uuid().optional(),
    paymentStatus: z.enum(["pending", "partial", "paid"]).optional().default("paid"),
    paidAmount: z.preprocess((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      return value;
    }, z.coerce.number().nullable()),
    paidAt: z.preprocess((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      return typeof value === "string" ? value.trim() : value;
    }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
    paymentMethod: z.string().trim().optional().default(""),
    paymentNote: z.string().trim().optional().default(""),
    existingAttachmentPath: z.string().trim().optional().default(""),
    removeAttachment: z.preprocess(
      (value) => value === "true" || value === "on" || value === true,
      z.boolean(),
    ),
  })
  .superRefine((value, ctx) => {
    const hasPaidAmount = value.paidAmount !== null && value.paidAmount > 0;

    if (value.paidAmount !== null && value.paidAmount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paid amount must be zero or greater.",
        path: ["paidAmount"],
      });
    }

    if (hasPaidAmount) {
      if (value.paidAt === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paid date is required when entering a paid amount.",
          path: ["paidAt"],
        });
      }

      if (!value.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Payment method is required when entering a paid amount.",
          path: ["paymentMethod"],
        });
      }
    }
  });
