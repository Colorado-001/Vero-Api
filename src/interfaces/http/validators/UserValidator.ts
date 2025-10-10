import { Request } from "express";
import * as z from "zod";
import { ValidationError } from "../../../utils/errors/index.js";
import { updateProfileSchema } from "../schemas/index.js";

export class UserValidator {
  static validateProfileUpdate(req: Request) {
    const { error, data } = z.safeParse(updateProfileSchema, req.body);

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
