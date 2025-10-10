import express from "express";
import cors from "cors";

import { getCoreDependencies } from "../../config/factory.js";
import { createAuthRouter, createUserRouter } from "./routes/index.js";
import { Env } from "../../config/env.js";
import { errorConverter, errorHandler } from "./middlewares/index.js";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://vero-clientui.pages.dev",
];

export async function createHTTPServer(config: Env) {
  const coreDeps = await getCoreDependencies(config);

  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin(staticOrigin, callback) {
        if (staticOrigin) {
          const valid = ALLOWED_ORIGINS.includes(staticOrigin);
          if (valid) {
            callback(null, staticOrigin);
          }
        } else {
          callback(Error("Invalid origin"));
        }
      },
    })
  );

  app.use("/v1/auth", createAuthRouter(coreDeps, config));
  app.use("/v1/users", createUserRouter(coreDeps, config));

  app.use("/healthz", (_, res) => {
    res.status(200).json({ message: "Server is healthy!" });
  });

  app.use(errorConverter);
  app.use(errorHandler);

  return { app, close: coreDeps.close };
}
