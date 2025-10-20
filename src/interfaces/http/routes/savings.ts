import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares/index.js";
import { SavingsController, TransferController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";

export function createSavingsRouter(coreDeps: CoreDependencies, config: Env) {
  const router = Router();

  const controller = new SavingsController(coreDeps, config);

  router.post(
    "/autoflow",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.createAutoflow)
  );

  return router;
}
