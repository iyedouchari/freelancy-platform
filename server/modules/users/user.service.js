import AppError from "../../utils/AppError.js";
import { comparePassword, hashPassword } from "../../utils/hashPassword.js";
import { findUserByEmail, findUserById, findUserByIdWithPassword, updateUserById } from "./user.repository.js";

export const getCurrentUserProfile = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  return user;
};

export const getUserProfileById = async (id) => {
  const user = await findUserById(id);

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  return user;
};

export const updateCurrentUserProfile = async (userId, payload = {}) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : undefined;

  if (normalizedEmail && normalizedEmail !== user.email) {
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser && existingUser.id !== userId) {
      throw new AppError("Email already in use.", 409, "EMAIL_ALREADY_USED");
    }
  }

  return updateUserById(userId, {
    name: payload.name !== undefined ? String(payload.name || "").trim() : undefined,
    title: payload.title !== undefined ? String(payload.title || "").trim() : undefined,
    email: normalizedEmail,
    phone:
      payload.phone !== undefined || payload.telephone !== undefined
        ? String(payload.phone ?? payload.telephone ?? "").trim()
        : undefined,
    location: payload.location !== undefined ? String(payload.location || "").trim() : undefined,
    bio: payload.bio !== undefined ? String(payload.bio || "").trim() : undefined,
    avatarUrl:
      payload.avatarUrl !== undefined || payload.profileImage !== undefined
        ? String(payload.avatarUrl ?? payload.profileImage ?? "").trim()
        : undefined,
  });
};

export const changeCurrentUserPassword = async (userId, { currentPassword, newPassword } = {}) => {
  const user = await findUserByIdWithPassword(userId);

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  if (!String(currentPassword || "").trim()) {
    throw new AppError("Current password is required.", 400, "CURRENT_PASSWORD_REQUIRED");
  }

  const normalizedNewPassword = String(newPassword || "");
  if (normalizedNewPassword.length < 10) {
    throw new AppError("Password must contain at least 10 characters.", 400, "PASSWORD_TOO_SHORT");
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError("Current password is incorrect.", 401, "INVALID_CREDENTIALS");
  }

  const passwordHash = await hashPassword(normalizedNewPassword);
  await updateUserById(userId, { passwordHash });

  return { success: true };
};

