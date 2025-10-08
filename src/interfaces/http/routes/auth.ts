import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares";
import { AuthController } from "../controllers";
import { Env } from "../../../config/env";
import { CoreDependencies } from "../../../config/factory";

export function createAuthRouter(coreDeps: CoreDependencies, config: Env) {
  const router = Router();

  const controller = new AuthController(coreDeps, config);

  router.get("/signup/email", checkUser, asyncHandler(controller.signupEmail));

  return router;
}
