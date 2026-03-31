import { env } from "./env.js";

export const jwtConfig = Object.freeze({
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
});

