import path from "path";
import util from "util";
import winston from "winston";
import { type TransformableInfo } from "logform";
import { Env } from "../config/env";

const loggerCache = new Map<string, winston.Logger>();

export const cleanupLoggers = (): void => {
  console.log("Cleaning up loggers...");

  for (const [label, logger] of loggerCache) {
    console.log(`Closing logger: ${label}`);
    logger.close();
    console.log(`Logger ${label} closed`);
  }

  loggerCache.clear();
  console.log("All loggers cleaned up");
};

const createLogger = (label: string, config: Env) => {
  if (loggerCache.has(label)) {
    return loggerCache.get(label)!;
  }

  const logPath = config.LOG_PATH;

  const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.label({ label }),
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: "vero-api" },
    transports: [
      new winston.transports.File({
        filename: path.join(logPath, "error.log"),
        level: "error",
      }),
      new winston.transports.File({
        filename: path.join(logPath, "info.log"),
        level: "info",
      }),
      new winston.transports.File({
        filename: path.join(logPath, "debug.log"),
        level: "debug",
      }),
      new winston.transports.File({
        filename: path.join(logPath, "all_combined.log"),
      }),
    ],
  });

  if (process.env.NODE_ENV !== "test") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.splat(),
          winston.format.colorize(),
          winston.format.timestamp(),
          // winston.format.printf(
          //   // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          //   (info: TransformableInfo) =>
          //     `${info.timestamp} ${info.level}: ${info.message}`
          // )
          winston.format.printf(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            (info: TransformableInfo) => {
              const baseLog = `${info.timestamp} ${info.level}: ${info.message}`;
              if (info.data && typeof info.data === "object") {
                return `${baseLog} | Data: ${util.inspect(info.data, {
                  depth: null,
                  colors: true,
                })}`;
              }
              return baseLog;
            }
          )
        ),
      })
    );
  }

  logger.silent = config.LOG_SILENT;
  if (logger.silent) {
    console.log("Logger is disabled");
  }

  loggerCache.set(label, logger);

  return logger;
};

export default createLogger;
