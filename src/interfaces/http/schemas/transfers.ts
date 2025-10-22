import * as z from "zod";

export const getGasFeeSchema = z.object({
  amount: z.string(),
  to: z.string(),
  tokenSymbol: z.string().optional(),
  delegation: z.string().optional(),
  pin: z.string().length(6).optional(),
});
