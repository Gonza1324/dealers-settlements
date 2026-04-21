import { z } from "zod";

function normalizeMonthStart(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  return trimmed;
}

const optionalIdField = z.string().uuid().optional().or(z.literal("")).default("");
const requiredDateField = z.preprocess((value) => {
  return typeof value === "string" ? value.trim() : value;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required."));

export const expenseFiltersSchema = z.object({
  periodMonth: z.string().optional().default(""),
  categoryId: optionalIdField,
  dealerId: optionalIdField,
  scopeType: z
    .enum(["", "single_dealer", "selected_dealers", "all_dealers"])
    .default(""),
});

export const expenseCategorySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")).default(""),
  name: z.string().trim().min(1, "Category name is required."),
  isActive: z.preprocess((value) => value === "true" || value === true, z.boolean()),
});

export const expenseRecurringTemplateSchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal("")).default(""),
    name: z.string().trim().min(1, "Template name is required."),
    categoryId: optionalIdField,
    defaultDescription: z.string().trim().optional().default(""),
    defaultAmount: z.coerce.number().min(0, "Amount must be zero or greater."),
    scopeType: z.enum(["single_dealer", "selected_dealers", "all_dealers"]),
    selectedDealerIds: z.array(z.string().uuid()).default([]),
    startDate: requiredDateField,
    endDate: z.preprocess((value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      return typeof value === "string" ? value.trim() : value;
    }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
    isActive: z.preprocess((value) => value === "true" || value === true, z.boolean()),
  })
  .superRefine((value, ctx) => {
    if (
      value.scopeType === "single_dealer" &&
      value.selectedDealerIds.length !== 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select exactly one dealer for single dealer scope.",
        path: ["selectedDealerIds"],
      });
    }

    if (
      value.scopeType === "selected_dealers" &&
      value.selectedDealerIds.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one dealer for selected dealers scope.",
        path: ["selectedDealerIds"],
      });
    }

    if (value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be earlier than start date.",
        path: ["endDate"],
      });
    }
  });

export const expenseSchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal("")).default(""),
    recurringTemplateId: optionalIdField,
    categoryId: optionalIdField,
    description: z.string().trim().min(1, "Description is required."),
    amount: z.coerce.number().min(0, "Amount must be zero or greater."),
    expenseDate: requiredDateField,
    periodMonth: z.preprocess(normalizeMonthStart, requiredDateField),
    scopeType: z.enum(["single_dealer", "selected_dealers", "all_dealers"]),
    singleDealerId: optionalIdField,
    selectedDealerIds: z.array(z.string().uuid()).default([]),
    existingAttachmentPath: z.string().optional().default(""),
    removeAttachment: z.preprocess(
      (value) => value === "true" || value === "on" || value === true,
      z.boolean(),
    ),
    isRecurringInstance: z.preprocess(
      (value) => value === "true" || value === "on" || value === true,
      z.boolean(),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.scopeType === "single_dealer" && !value.singleDealerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a dealer for single dealer scope.",
        path: ["singleDealerId"],
      });
    }

    if (
      value.scopeType === "selected_dealers" &&
      value.selectedDealerIds.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose at least one dealer for selected dealers scope.",
        path: ["selectedDealerIds"],
      });
    }
  });

export const expenseDeleteSchema = z.object({
  expenseId: z.string().uuid(),
});
