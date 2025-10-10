import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares/index.js";
import { UserController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";

export function createUserRouter(coreDeps: CoreDependencies, config: Env) {
  const router = Router();

  const controller = new UserController(coreDeps, config);

  router.get(
    "/username-check/:username",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.isUsernameAvailable)
  );

  router.post(
    "/me/setup-pin",
    checkUser(coreDeps.jwtService),
    controller.setupMyPin
  );

  router.get(
    "/me",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.getLoggedInUser)
  );
  router.patch(
    "/me",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.updateMyProfile)
  );

  return router;
}
