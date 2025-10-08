import express from "express";
import cors from "cors";

import { getCoreDependencies } from "../../config/factory";
import { createAuthRouter } from "./routes";
import { Env } from "../../config/env";
import { errorConverter, errorHandler } from "./middlewares";

const ALLOWED_ORIGINS = ["http://localhost:5173"];

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
        }

        callback(Error("Invalid origin"));
      },
    })
  );

  app.use("/v1/auth", createAuthRouter(coreDeps, config));

  app.use("/healthz", (_, res) => {
    res.status(200).json({ message: "Server is healthy!" });
  });

  app.use(errorConverter);
  app.use(errorHandler);

  return { app, close: coreDeps.close };
}
