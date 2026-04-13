import { appLogger } from "../utils/logger.js";

export const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    appLogger.info("HTTP_REQUEST", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
    });
  });

  next();
};
