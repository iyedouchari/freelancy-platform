import AppError from "../utils/AppError.js";

const requestsByKey = new Map();

const resolveKey = (req) => {
  return `${req.ip}:${req.path}`;
};

export const rateLimitMiddleware = ({ windowMs = 60_000, max = 120 } = {}) => {
  return (req, _res, next) => {
    const key = resolveKey(req);
    const now = Date.now();
    const current = requestsByKey.get(key);

    if (!current || now > current.resetTime) {
      requestsByKey.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    current.count += 1;

    if (current.count > max) {
      next(new AppError("Too many requests, please try again later.", 429, "RATE_LIMITED"));
      return;
    }

    next();
  };
};

