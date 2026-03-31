import { env } from "./env.js";

export const corsOptions = {
  origin: env.CLIENT_ORIGIN,
  credentials: true,
};

