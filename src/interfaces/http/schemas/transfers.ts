import * as z from "zod";

export const getGasFeeSchema = z.object({
  amount: z.string(),
  to: z.string(),
  tokenSymbol: z.string().optional(),
});
