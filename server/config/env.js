import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root first, then keep legacy support for server/.env.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../server/.env") });

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseNumber(process.env.PORT, 4000),
  SYSTEM_WALLET_OWNER_ID: parseNumber(process.env.SYSTEM_WALLET_OWNER_ID, 999),
  SYSTEM_WALLET_EMAIL: process.env.SYSTEM_WALLET_EMAIL || "system-wallet-999@platform.local",
  SYSTEM_WALLET_NAME: process.env.SYSTEM_WALLET_NAME || "System Wallet",
  SYSTEM_WALLET_PASSWORD: process.env.SYSTEM_WALLET_PASSWORD || "system-wallet-999-pass",
  B2_ENDPOINT: process.env.B2_ENDPOINT || "",
  B2_KEY_ID: process.env.B2_KEY_ID || "",
  B2_APP_KEY: process.env.B2_APP_KEY || "",
  B2_BUCKET: process.env.B2_BUCKET || "",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "replace-with-a-long-random-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: parseNumber(process.env.DB_PORT, 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "project",
  DB_POOL_SIZE: parseNumber(process.env.DB_POOL_SIZE, 10),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseNumber(process.env.SMTP_PORT, 465),
  SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, true),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "",
});
