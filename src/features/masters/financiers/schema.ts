import { z } from "zod";

export const financierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  is_active: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export const aliasSchema = z.object({
  id: z.string().uuid().optional(),
  financier_id: z.string().uuid(),
  alias: z.string().trim().min(1).max(160),
});
