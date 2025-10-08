import { Request } from "express";
import * as z from "zod";
import { ValidationError } from "../../../utils/errors";
import {
  setupUserWithEmailSchema,
  verifySetupUserWithEmailSchema,
} from "../schemas";

export class AuthValidator {
  static validateEmailSignup(req: Request) {
    const { error, data } = z.safeParse(setupUserWithEmailSchema, req.body);

    if (error) {
      const combinedMessage = z.treeifyError(error);
      throw new ValidationError(
        "Invalid request input",
        combinedMessage.errors
      );
    }

    return data;
  }

  static validateVerifyEmailSignup(req: Request) {
    const { error, data } = z.safeParse(
      verifySetupUserWithEmailSchema,
      req.body
    );

    if (error) {
      const combinedMessage = z.treeifyError(error);
      throw new ValidationError(
        "Invalid request input",
        combinedMessage.errors
      );
    }

    return data;
  }
}
