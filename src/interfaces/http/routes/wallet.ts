import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares/index.js";
import { WalletController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";

export function createWalletRouter(coreDeps: CoreDependencies, config: Env) {
  const router = Router();

  const controller = new WalletController(coreDeps, config);

  router.get(
    "/portfolio",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.getPortfolio)
  );

  return router;
}
