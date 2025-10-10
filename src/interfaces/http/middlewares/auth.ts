import { JwtService } from "../../../application/services/index.js";
import { UnauthorizedError } from "../../../utils/errors/index.js";
import { asyncHandler } from "./async-handler.js";

const excludePaths = ["/docs", "/docs/"];

export const checkUser = (jwtService: JwtService) =>
  asyncHandler(async (req, _, next) => {
    // Skip JWT check for excluded paths
    if (excludePaths.includes(req.path)) {
      return next();
    }

    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedError("Unauthenticated");
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("Unauthenticated");
    }

    try {
      const data = jwtService.verify<{ sub: string }>(token);

      req.user = data;

      next();
    } catch (error) {
      throw new UnauthorizedError("Unauthenticated");
    }
  });
