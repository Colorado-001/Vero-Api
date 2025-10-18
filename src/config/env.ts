import dotenv from "dotenv";
import path from "path";
import * as z from "zod";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true,
});

export let envVars: Env;

export const getEnvVars = (): Env => {
  if (!envVars) {
    throw new Error("envVars not initialized. Call validateEnv first.");
  }
  return envVars;
};

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("localhost"),

  LOG_LEVEL: z.enum(["info", "debug", "error"]).default("info"),
  LOG_PATH: z.string().default("./logs"),
  LOG_SILENT: z.boolean().default(false),

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  RPC_URL: z.url(),
  ENCRYPTION_KEY: z.string(),
  JWT_SECRET: z.string(),

  NOTIFICATION_SERVICE: z.enum(["mock", "mailgun"]),
  EMAIL_TEMPLATE_PARSER_SERVICE: z.enum(["mock", "file"]),
  COINGECKO_API_KEY: z.string(),
  ALCHEMY_API_KEY: z.string(),
  ALCHEMY_WEBHOOK_SIGNING_KEY: z.string(),
  ALCHEMY_GAS_POLICY_ID: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, any>): Env {
  const validated = envSchema.parse(env);
  envVars = validated;
  if (envVars.NODE_ENV !== "production") console.log(envVars);
  return validated;
}
