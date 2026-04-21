import { z } from "zod";

export const partnerSchema = z.object({
  id: z.string().uuid().optional(),
  display_name: z.string().trim().min(2).max(120),
  user_id: z.string().uuid().optional().nullable(),
  is_active: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});
