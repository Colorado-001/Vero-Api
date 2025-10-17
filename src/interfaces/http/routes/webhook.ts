import { Router } from "express";
import { Env } from "../../../config/env";
import { createAlchemyParser, validateAlchemySignature } from "../middlewares";
import { WebhookController } from "../controllers";

export function createWebhookRouter(config: Env) {
  const router = Router();

  const controller = new WebhookController(config);

  router.post(
    "/alchemy/transaction",
    createAlchemyParser(),
    validateAlchemySignature(config.ALCHEMY_WEBHOOK_SIGNING_KEY),
    controller.processAlchemyWebhook
  );

  return router;
}
