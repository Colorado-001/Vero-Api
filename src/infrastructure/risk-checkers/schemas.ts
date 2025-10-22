import { z } from "zod";

export const riskResultSchema = z.object({
  risk: z.coerce.number().min(0),
  confidence: z.coerce.number().min(0),
});
