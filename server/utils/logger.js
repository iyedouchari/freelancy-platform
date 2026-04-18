import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import winston from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDir = join(__dirname, "..", "logs");

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const appLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "freelancy-api" },
  transports: [
    new winston.transports.File({ filename: join(logsDir, "combined.log") }),
    new winston.transports.File({ filename: join(logsDir, "error.log"), level: "error" }),
  ],
});

const safeMeta = (meta) => (meta && typeof meta === "object" ? meta : {});

export const logAuthEvent = (message, meta = {}) => {
  appLogger.info(message, { scope: "auth", ...safeMeta(meta) });
};

export const logAuthError = (message, meta = {}) => {
  appLogger.error(message, { scope: "auth", ...safeMeta(meta) });
};

export const logProjectEvent = (message, meta = {}) => {
  appLogger.info(message, { scope: "project", ...safeMeta(meta) });
};

export const logUserActivity = (message, meta = {}) => {
  appLogger.info(message, { scope: "user", ...safeMeta(meta) });
};

if (process.env.NODE_ENV !== "production") {
  appLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}
