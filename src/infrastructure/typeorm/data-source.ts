import path from "path";
import { DataSource } from "typeorm";
import { Env } from "../../config/env";

export async function initializeDataSource(env: Env): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: false,
    logging: env.NODE_ENV === "development",
    entities: [path.join(__dirname, "./entities/**/*.{ts,js}")],
    migrations: [path.join(__dirname, "./migrations/**/*.{ts,js}")],
    subscribers: [],
    poolSize: 10,
    extra: {
      connectionTimeoutMillis: 5000,
    },
  });

  await dataSource.initialize();
  return dataSource;
}

export async function closeDataSource(dataSource: DataSource): Promise<void> {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
