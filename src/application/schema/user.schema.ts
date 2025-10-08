import * as z from "zod";

const createUserSchema = z.object({
  privateKey: z.string(),
  smartAccountAddress: z.string(),
  ownerEOA: z.string(),
  implementation: z.string(),
  deployed: z.boolean(),
});
