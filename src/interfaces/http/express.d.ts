import { type Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user: { sub: string };
    }
  }
}

export interface AuthRequest extends Request {
  user: { sub: string };
}
