import { NextFunction, Request, Response } from "express";
import winston from "winston";
import { ForbiddenError } from "../../../utils/errors";

export const verifyWorker =
  (expectedKey: string, logger: winston.Logger) =>
  (req: Request, res: Response, next: NextFunction) => {
    logger.debug({
      message: "Verify worker request",
      data: { headers: req.headers, origin: req.hostname },
    });

    const apiKey = req.headers["X-Api-Key"];

    if (apiKey !== expectedKey) {
      throw new ForbiddenError("Invalid worker api key");
    }

    next();
  };
