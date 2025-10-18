import crypto from "crypto";
import * as z from "zod";
import { toHex } from "viem";
import { ValidationError } from "./errors";
import winston from "winston";

export function generateSecureOtp(length = 6): string {
  const max = Math.pow(10, length);
  const code = crypto.randomInt(0, max).toString().padStart(length, "0");
  return "000000";
}

export function validateJsonPayload<T>(
  payload: any,
  schema: z.ZodType<T>,
  logger?: winston.Logger
): T {
  const { error, data } = z.safeParse(schema, payload);

  if (error) {
    const combinedMessage = z.treeifyError(error);

    if (logger) {
      logger.error(error);
    }

    throw new ValidationError("Invalid request input", combinedMessage.errors);
  }

  return data;
}

export function serializeUserOp(userOp: any) {
  return JSON.parse(
    JSON.stringify(userOp, (key, value) =>
      typeof value === "bigint" ? toHex(value) : value
    )
  );
}
