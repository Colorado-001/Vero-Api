import { UnauthorizedError } from "../../../utils/errors";
import { asyncHandler } from "./async-handler";

const excludePaths = ["/docs", "/docs/"];

// TODO: change to jwt
export const checkUser = asyncHandler(async (req, _, next) => {
  const sub = req.headers["x-user-id"] as string;

  console.log("USER >>>>>", sub);

  if (!sub && !excludePaths.some((e) => req.path.startsWith(e))) {
    throw new UnauthorizedError();
  }

  req.user = { sub };

  next();
});
