import { Router } from "express";
import { asyncHandler, checkUser } from "../middlewares/index.js";
import { NotificationController } from "../controllers/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";

export function createNotificationRouter(
  coreDeps: CoreDependencies,
  config: Env
) {
  const router = Router();

  const controller = new NotificationController(coreDeps, config);

  router.get(
    "/",
    checkUser(coreDeps.jwtService),
    asyncHandler(controller.listNotifications)
  );

  return router;
}
