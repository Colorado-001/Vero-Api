import { DataSource } from "typeorm";
import { config } from "dotenv";
import path from "path";

config(); // Load .env

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "./entities/**/*.{ts,js}")],
  migrations: [path.join(__dirname, "./migrations/**/*.{ts,js}")],
});
