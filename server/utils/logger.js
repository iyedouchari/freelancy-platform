import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.resolve(__dirname, "../logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const readableErrorFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, message, email, userId, statusCode, code, stack }) => {
    const details = [];

    if (email) {
      details.push(`email=${email}`);
    }

    if (userId) {
      details.push(`userId=${userId}`);
    }

    if (statusCode) {
      details.push(`status=${statusCode}`);
    }

    if (code) {
      details.push(`code=${code}`);
    }

    const suffix = details.length ? ` | ${details.join(" | ")}` : "";
    const stackBlock = stack ? `\n${stack}` : "";

    return `[${timestamp}] ${message}${suffix}${stackBlock}`;
  }),
);

const readableActivityFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({
      timestamp,
      message,
      email,
      userId,
      role,
      requestId,
      proposalId,
      deliveryId,
      title,
      status,
      ip,
    }) => {
      const details = [];

      if (userId) {
        details.push(`userId=${userId}`);
      }

      if (email) {
        details.push(`email=${email}`);
      }

      if (role) {
        details.push(`role=${role}`);
      }

      if (requestId) {
        details.push(`projet=${requestId}`);
      }

      if (proposalId) {
        details.push(`proposition=${proposalId}`);
      }

      if (deliveryId) {
        details.push(`livraison=${deliveryId}`);
      }

      if (title) {
        details.push(`titre="${title}"`);
      }

      if (status) {
        details.push(`statut=${status}`);
      }

      if (ip) {
        details.push(`ip=${ip}`);
      }

      const suffix = details.length ? ` | ${details.join(" | ")}` : "";
      return `[${timestamp}] ${message}${suffix}`;
    },
  ),
);

const createLogger = (filename, level = "info") =>
  winston.createLogger({
    level,
    format: baseFormat,
    defaultMeta: { service: "freelancy-api" },
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, filename),
      }),
    ],
  });

export const appLogger = createLogger("combined.log");
export const authLogger = createLogger("auth.log");
export const projectLogger = createLogger("projects.log");
export const proposalLogger = createLogger("proposals.log");
export const activityLogger = winston.createLogger({
  level: "info",
  format: readableActivityFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "activity.log"),
    }),
  ],
});
export const serverErrorLogger = winston.createLogger({
  level: "error",
  format: readableErrorFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  const createConsoleTransport = () =>
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const serializedMeta = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `[${timestamp}] ${level}: ${message}${serializedMeta}`;
        }),
      ),
    });

  appLogger.add(createConsoleTransport());
  authLogger.add(createConsoleTransport());
  projectLogger.add(createConsoleTransport());
  activityLogger.add(createConsoleTransport());
  serverErrorLogger.add(createConsoleTransport());
}

export const logAuthEvent = (event, details = {}) => {
  authLogger.info(event, details);
  appLogger.info(event, { category: "auth", ...details });
  activityLogger.info(event, details);
};

export const logAuthError = (message, details = {}) => {
  authLogger.error(message, details);
  appLogger.error(message, { category: "auth", ...details });
  serverErrorLogger.error(message, { category: "auth", ...details });
};

export const logProjectEvent = (event, details = {}) => {
  projectLogger.info(event, details);
  appLogger.info(event, { category: "project", ...details });
  activityLogger.info(event, details);
};

export const logProposalEvent = (event, details = {}) => {
  proposalLogger.info(event, details);
  appLogger.info(event, { category: "proposal", ...details });
  activityLogger.info(event, details);
};

export const logUserActivity = (message, details = {}) => {
  activityLogger.info(message, details);
  appLogger.info(message, { category: "activity", ...details });
};

export const logServerError = (error, details = {}) => {
  const payload = {
    ...details,
    name: error?.name,
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode,
    stack: error?.stack,
  };

  serverErrorLogger.error(error?.message || "Erreur serveur", payload);
  appLogger.error(error?.message || "Erreur serveur", { category: "error", ...payload });
};
