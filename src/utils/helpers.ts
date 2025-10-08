import crypto from "crypto";

export function generateSecureOtp(length = 6): string {
  const max = Math.pow(10, length);
  const code = crypto.randomInt(0, max).toString().padStart(length, "0");
  return code;
}
