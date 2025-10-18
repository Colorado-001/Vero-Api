import { Request, Response } from "express";
import winston from "winston";

import { validateJsonPayload } from "../../../utils/helpers";
import { alchemyWebhookEventSchema } from "../schemas";
import createLogger from "../../../logging/logger.config";
import { Env } from "../../../config/env";

export class WebhookController {
  private readonly logger: winston.Logger;

  constructor(config: Env) {
    this.logger = createLogger("WebhookController", config);
  }

  processAlchemyWebhook = async (req: Request, res: Response) => {
    const webhookEvent = validateJsonPayload(
      req.body,
      alchemyWebhookEventSchema
    );

    this.logger.info("Received Webhook Event:", webhookEvent);

    res.json({});
  };
}
