import { env } from "../config/env.js";
import { errorResponse } from "../utils/apiResponse.js";

export const errorMiddleware = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_ERROR";
  const message = error.message || "Internal Server Error";

  if (statusCode >= 500) {
    console.error(error);
  }

  errorResponse(res, {
    statusCode,
    code,
    message: env.NODE_ENV === "production" && statusCode >= 500 ? "Internal Server Error" : message,
  });
};

