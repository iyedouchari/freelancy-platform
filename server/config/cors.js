import { env } from "./env.js";

const allowedOrigins = new Set([
  env.CLIENT_ORIGIN,
  "https://freelancy.tech",
  "http://freelancy.tech",
  "https://www.freelancy.tech",
  "http://www.freelancy.tech",
].filter(Boolean));

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isLocalDevOrigin =
      typeof origin === "string" &&
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    const isFreelancyOrigin =
      typeof origin === "string" &&
      /^https?:\/\/(www\.)?freelancy\.tech$/i.test(origin);

    const isVercelOrigin =
      typeof origin === "string" &&
      /^https:\/\/.*\.vercel\.app$/i.test(origin);

    if (allowedOrigins.has(origin) || isLocalDevOrigin || isFreelancyOrigin || isVercelOrigin) {
      callback(null, true);
      return;
    }

    // Do not throw an Error (which causes Express to crash with 500 error)
    callback(null, false);
  },
  credentials: true,
};

