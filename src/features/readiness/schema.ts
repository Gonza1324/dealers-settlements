import { z } from "zod";

export const readinessFiltersSchema = z.object({
  periodMonth: z.string().optional().default(""),
});
