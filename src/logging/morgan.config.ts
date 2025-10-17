import { type IncomingMessage } from "http";
import morgan from "morgan";
import createLogger from "./logger.config";
import { Env } from "../config/env";

const morganStream = (config: Env) => ({
  write: (message: string) => {
    createLogger("morgan", config).info(message.trim());
  },
});

// Define a custom token for Morgan. (to log remote address)
morgan.token("remote-addr", function (req: IncomingMessage): string {
  // incase of reverse proxy or load balancer
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0];
  }
  return req.socket.remoteAddress ?? "";
});

// Define a custom format string for Morgan. (to ignore timestamp... winston already does that)
morgan.format(
  "custom_request_log_format",
  ':method ":url" :status "Referer :referrer" - :response-time ms - (remote :remote-addr)'
);

export default (config: Env) =>
  morgan("custom_request_log_format", { stream: morganStream(config) });
