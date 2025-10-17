import express from "express";
import cors from "cors";

import morgan_config from "../../logging/morgan.config";
import { getCoreDependencies } from "../../config/factory.js";
import {
  createAuthRouter,
  createUserRouter,
  createWalletRouter,
  createWebhookRouter,
} from "./routes/index.js";
import { Env } from "../../config/env.js";
import { errorConverter, errorHandler } from "./middlewares/index.js";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://vero-clientui.pages.dev",
  "https://b8e446097fe4.ngrok-free.app",
];

export async function createHTTPServer(config: Env) {
  const coreDeps = await getCoreDependencies(config);

  const app = express();

  // app.use(express.json());
  app.use(
    cors({
      origin(staticOrigin, callback) {
        if (staticOrigin) {
          const valid = ALLOWED_ORIGINS.includes(staticOrigin);
          if (valid) {
            callback(null, staticOrigin);
          }
        } else {
          // callback(Error(`Invalid origin: ${staticOrigin}`));
          callback(null); // TODO: Block undefined origin before going live
        }
      },
    })
  );
  app.use(morgan_config(config));

  app.use("/v1/auth", express.json(), createAuthRouter(coreDeps, config));
  app.use("/v1/users", express.json(), createUserRouter(coreDeps, config));
  app.use("/v1/wallet", express.json(), createWalletRouter(coreDeps, config));
  app.use("/webhooks", createWebhookRouter(config));

  app.use("/healthz", (_, res) => {
    res.status(200).json({ message: "Server is healthy!" });
  });

  app.use(errorConverter);
  app.use(errorHandler);

  return { app, close: coreDeps.close };
}
