import { z } from "zod";

export const dealerSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  status: z.enum(["active", "paused", "closed", "archived"]),
});

export const shareSchema = z
  .object({
    id: z.string().uuid().optional(),
    dealer_id: z.string().uuid(),
    partner_id: z.string().uuid(),
    share_percentage: z.coerce.number().positive().max(100),
    valid_from: z.string().min(1),
    valid_to: z.string().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (value) =>
      !value.valid_to || new Date(value.valid_to) >= new Date(value.valid_from),
    {
      message: "Valid to must be greater than or equal to valid from.",
      path: ["valid_to"],
    },
  );

export const assignmentSchema = z
  .object({
    id: z.string().uuid().optional(),
    dealer_id: z.string().uuid(),
    financier_id: z.string().uuid(),
    start_date: z.string().min(1),
    end_date: z.string().optional().nullable(),
    financial_notes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (value) =>
      !value.end_date || new Date(value.end_date) >= new Date(value.start_date),
    {
      message: "End date must be greater than or equal to start date.",
      path: ["end_date"],
    },
  );
