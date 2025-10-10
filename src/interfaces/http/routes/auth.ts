import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares/index.js";
import { AuthController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";

export function createAuthRouter(coreDeps: CoreDependencies, config: Env) {
  const router = Router();

  const controller = new AuthController(coreDeps, config);

  router.post("/signup/email", asyncHandler(controller.signupEmail));
  router.post(
    "/signup/email/verify",
    asyncHandler(controller.verifySignupEmail)
  );

  return router;
}
