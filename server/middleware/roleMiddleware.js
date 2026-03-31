import AppError from "../utils/AppError.js";

export const roleMiddleware = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.auth?.role) {
      next(new AppError("User role not found in request context.", 401, "ROLE_MISSING"));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(new AppError("You are not allowed to access this resource.", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
};

export const authorize = roleMiddleware;

