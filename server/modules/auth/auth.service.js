import AppError from "../../utils/AppError.js";
import { generateToken } from "../../utils/generateToken.js";
import { comparePassword, hashPassword } from "../../utils/hashPassword.js";
<<<<<<< HEAD
import { logAuthError, logAuthEvent } from "../../utils/logger.js";
=======
import { mailer } from "../../utils/mailer.js";
>>>>>>> 72a04575963f9545b273dee9f26ede78def149db
import { findAuthUserByEmail, findAuthUserById, insertAuthUser } from "./auth.repository.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const buildAuthResponse = (user) => {
  return {
    user,
    token: generateToken(user),
  };
};

const buildRoleLabel = (role) => {
  if (role === "freelancer") {
    return "freelance";
  }

  if (role === "client") {
    return "client";
  }

  return role || "utilisateur";
};

const sendWelcomeEmail = async (user) => {
  if (!user?.email) {
    return;
  }

  const userName = user.name || "Utilisateur";
  const roleLabel = buildRoleLabel(user.role);

  try {
    await mailer.sendMail({
      to: user.email,
      subject: "Bienvenue sur Freelancy",
      text: `Bonjour ${userName},\n\nVotre inscription est confirmee. Votre compte ${roleLabel} est maintenant actif sur Freelancy.\n\nVous pouvez vous connecter et commencer a utiliser la plateforme.\n\n- Equipe Freelancy`,
      html: `
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Votre inscription est confirmee.</p>
        <p>Votre compte <strong>${roleLabel}</strong> est maintenant actif sur Freelancy.</p>
        <p>Vous pouvez vous connecter et commencer a utiliser la plateforme.</p>
        <p>- Equipe Freelancy</p>
      `,
    });
  } catch (error) {
    // Keep registration successful even when SMTP is unavailable.
    console.warn(
      `[auth.register] Welcome email not sent to ${user.email}: ${error?.message || "Unknown error"}`,
    );
  }
};

export const register = async ({ name, company, title, location, email, phone, password, role }) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findAuthUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError(
      "Un utilisateur avec cette adresse email existe deja.",
      409,
      "EMAIL_ALREADY_USED",
    );
  }

  const passwordHash = await hashPassword(password);
  const userId = await insertAuthUser({
    name,
    company,
    title,
    location,
    email: normalizedEmail,
    phone,
    passwordHash,
    role,
  });
  const user = await findAuthUserById(userId);

  await sendWelcomeEmail(user);

  return buildAuthResponse(user);
};

export const login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await findAuthUserByEmail(normalizedEmail, { includePassword: true });

  if (!user) {
    logAuthEvent("Tentative de connexion avec un email introuvable", {
      email: normalizedEmail,
    });
    logAuthError("Echec de connexion : utilisateur introuvable", {
      email: normalizedEmail,
    });
    throw new AppError("Cette adresse email n'est associee a aucun compte.", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    logAuthEvent("Tentative de connexion avec mot de passe incorrect", {
      email: normalizedEmail,
      userId: user.id,
    });
    logAuthError("Echec de connexion : mot de passe incorrect", {
      email: normalizedEmail,
      userId: user.id,
    });
    throw new AppError("Mot de passe incorrect. Veuillez réessayer.", 401, "INVALID_CREDENTIALS");
  }

  const { passwordHash, ...safeUser } = user;

  if (safeUser.isSuspended) {
    logAuthEvent("Connexion refusée : utilisateur suspendu", {
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });
    return {
      user: safeUser,
      token: null,
    };
  }

  return buildAuthResponse(safeUser);
};

export const getAuthUserById = async (id) => {
  const user = await findAuthUserById(id);

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404, "USER_NOT_FOUND");
  }

  return user;
};
