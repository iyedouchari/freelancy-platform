<<<<<<< HEAD
import { verifyAccessToken } from "../utils/tokenUtils.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing." });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ message: "Invalid authorization format. Use Bearer <token>." });
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
=======
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
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired token.", 401, "TOKEN_INVALID"));
  }
};

>>>>>>> 6d7d396b3e930ea7d876fff44858e0fe069a50b2
