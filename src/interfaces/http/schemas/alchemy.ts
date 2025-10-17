import * as z from "zod";

export const alchemyWebhookTypeSchema = z.enum(["ADDRESS_ACTIVITY"]);

export const alchemyWebhookEventSchema = z.object({
  webhookId: z.string(),
  id: z.string(),
  createdAt: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val)),
  type: alchemyWebhookTypeSchema,
  event: z.record(z.any(), z.any()),
});

export type AlchemyWebhookEvent = z.infer<typeof alchemyWebhookEventSchema>;
export type AlchemyWebhookType = z.infer<typeof alchemyWebhookTypeSchema>;
