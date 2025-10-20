import { Router } from "express";
import { asyncHandler, checkUser, verifyWorker } from "../middlewares/index.js";
import { SavingsController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";
import createLogger from "../../../logging/logger.config.js";

export function createSavingsRouter(coreDeps: CoreDependencies, config: Env) {
  const router = Router();

  const controller = new SavingsController(coreDeps, config);

  router.post(
    "/autoflow",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.createAutoflow)
  );

  router.get(
    "/autoflow",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.listUserAutoflow)
  );

  router.post(
    "/autoflow/trigger",
    verifyWorker(config.WORKER_API_KEY, createLogger("Verify Worker", config)),
    controller.triggerSavings
  );

  return router;
}
