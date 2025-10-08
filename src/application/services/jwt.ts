import type { StringValue } from "ms";
import jwt, { SignOptions } from "jsonwebtoken";

export class JwtService {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  sign(payload: object, expiresIn: number | StringValue = "8h"): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, this.secret, options);
  }

  verify<T = any>(token: string): T {
    try {
      return jwt.verify(token, this.secret) as T;
    } catch (err) {
      throw new Error("Invalid or expired JWT");
    }
  }

  decode<T = any>(token: string): T | null {
    return jwt.decode(token) as T | null;
  }
}
