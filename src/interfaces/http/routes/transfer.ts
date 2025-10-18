import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares/index.js";
import { TransferController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";

export function createTransferRouter(coreDeps: CoreDependencies, config: Env) {
  const router = Router();

  const controller = new TransferController(coreDeps, config);

  router.get(
    "/gas",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.getGas)
  );

  router.post(
    "/send",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.initiateTransfer)
  );

  return router;
}
