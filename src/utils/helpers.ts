import crypto from "crypto";
import * as z from "zod";
import { ValidationError } from "./errors";

export function generateSecureOtp(length = 6): string {
  const max = Math.pow(10, length);
  const code = crypto.randomInt(0, max).toString().padStart(length, "0");
  return "000000";
}

export function validateJsonPayload<T>(payload: any, schema: z.ZodType<T>): T {
  const { error, data } = z.safeParse(schema, payload);

  if (error) {
    const combinedMessage = z.treeifyError(error);
    throw new ValidationError("Invalid request input", combinedMessage.errors);
  }

  return data;
}
