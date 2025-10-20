import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares/index.js";
import { DelegationController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";

export function createDelegationRouter(
  coreDeps: CoreDependencies,
  config: Env
) {
  const router = Router();

  const controller = new DelegationController(coreDeps, config);

  router.post(
    "/",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.createDelegation)
  );

  router.get(
    "/",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.listDelegation)
  );

  return router;
}
