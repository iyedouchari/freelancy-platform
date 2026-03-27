import jwt from "jsonwebtoken";

const DEFAULT_SECRET = "dev-secret-change-me";
const DEFAULT_EXPIRES_IN = "7d";

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}
