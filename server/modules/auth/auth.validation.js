import AppError from "../../utils/AppError.js";
import { DEFAULT_ROLE, ROLES } from "../../utils/constants.js";

const isEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isStrongEnoughPassword = (value) => {
  return typeof value === "string" && value.length >= 6;
};

const sanitizeRole = (value) => {
  const normalized = String(value || DEFAULT_ROLE).toLowerCase();
  const allowedRoles = [ROLES.CLIENT, ROLES.FREELANCER, ROLES.ADMIN];

  if (!allowedRoles.includes(normalized)) {
    throw new AppError("Invalid role. Allowed values: client, freelancer, admin.", 400, "INVALID_ROLE");
  }

  return normalized;
};

export const validateRegisterPayload = (body) => {
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const role = sanitizeRole(body?.role);

  if (!name) {
    throw new AppError("Name is required.", 400, "NAME_REQUIRED");
  }

  if (!email || !isEmail(email)) {
    throw new AppError("A valid email is required.", 400, "EMAIL_INVALID");
  }

  if (!isStrongEnoughPassword(password)) {
    throw new AppError("Password must be at least 6 characters long.", 400, "PASSWORD_WEAK");
  }

  return { name, email, password, role };
};

export const validateLoginPayload = (body) => {
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !isEmail(email)) {
    throw new AppError("A valid email is required.", 400, "EMAIL_INVALID");
  }

  if (!password) {
    throw new AppError("Password is required.", 400, "PASSWORD_REQUIRED");
  }

  return { email, password };
};

