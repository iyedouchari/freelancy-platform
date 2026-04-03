import { env } from "./env.js";

const allowedOrigins = new Set([
  env.CLIENT_ORIGIN,
]);

export const corsOptions = {
  origin(origin, callback) {
    const isLocalDevOrigin =
      typeof origin === "string" &&
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

