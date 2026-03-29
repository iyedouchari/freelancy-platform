import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseNumber(process.env.PORT, 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "replace-with-a-long-random-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: parseNumber(process.env.DB_PORT, 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "project",
  DB_POOL_SIZE: parseNumber(process.env.DB_POOL_SIZE, 10),
});

