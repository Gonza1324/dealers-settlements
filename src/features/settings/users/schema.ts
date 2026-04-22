import { z } from "zod";

export const settingsUserSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")).default(""),
  email: z.string().trim().email("A valid email is required."),
  fullName: z.string().trim().min(1, "Full name is required."),
  role: z.enum(["super_admin", "expense_admin", "partner_viewer"]),
  isActive: z.preprocess((value) => value === "true" || value === true, z.boolean()),
});

export const settingsUserStatusSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().trim().email("A valid email is required."),
  nextIsActive: z.preprocess((value) => value === "true" || value === true, z.boolean()),
});

export const settingsUserResetSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().trim().email("A valid email is required."),
});
