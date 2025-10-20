import * as z from "zod";

export const createDelegationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("allowance"),
    name: z.string(),
    walletAddress: z.string(),
    frequency: z.enum(["Daily"]),
    startDate: z.coerce.date(),
    amountLimit: z.coerce.number(),
  }),
  z.object({
    type: z.literal("group_wallet"),
    name: z.string(),
    members: z.array(z.object({ name: z.string(), address: z.string() })),
    approvalThreshold: z.number(),
    amountLimit: z.coerce.number(),
  }),
]);
