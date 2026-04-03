import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import AppError from "../utils/AppError.js";

const extractBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export const authMiddleware = (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(new AppError("Authorization token is missing.", 401, "TOKEN_MISSING"));
    return;
  }

  try {
    const payload = jwt.verify(token, jwtConfig.secret);
    const role = String(payload.role || "").toLowerCase();
    req.auth = {
      userId: payload.sub,
      role,
      email: payload.email,
    };
    req.user = {
      id: payload.sub,
      role,
      email: payload.email,
    };
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired token.", 401, "TOKEN_INVALID"));
  }
};
export const authenticate = authMiddleware;
