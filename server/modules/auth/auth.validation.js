import AppError from "../../utils/AppError.js";
import { DEFAULT_ROLE, ROLES } from "../../utils/constants.js";

const isEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isStrongEnoughPassword = (value) => {
  return typeof value === "string" && value.length >= 10;
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
  const company = String(body?.company || "").trim();
  const title = String(body?.title || "").trim();
  const location = String(body?.location || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = String(body?.phone || "").trim();
  const bio = String(body?.bio || "").trim();
  const avatarUrl = String(body?.avatarUrl ?? body?.profileImage ?? "").trim();
  const password = String(body?.password || "");
  const role = sanitizeRole(body?.role);
  const fields = Array.isArray(body?.fields) ? body.fields : [];

  if (!name) {
    throw new AppError("Le nom complet est requis.", 400, "NAME_REQUIRED");
  }

  if (!email || !isEmail(email)) {
    throw new AppError("Une adresse email valide est requise.", 400, "EMAIL_INVALID");
  }

  if (!isStrongEnoughPassword(password)) {
    throw new AppError("Le mot de passe doit contenir au moins 10 caractères.", 400, "PASSWORD_WEAK");
  }

  // Le champ title (Fonction) a été retiré du formulaire d'inscription et est désormais optionnel.

  if (!location) {
    throw new AppError("La localisation est requise.", 400, "LOCATION_REQUIRED");
  }

  if (!phone) {
    throw new AppError("Le numéro de téléphone est requis.", 400, "PHONE_REQUIRED");
  }

  return { name, company, title, location, email, phone, bio, avatarUrl, password, role, fields };
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
