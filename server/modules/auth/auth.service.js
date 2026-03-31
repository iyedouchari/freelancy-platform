import AppError from "../../utils/AppError.js";
import { generateToken } from "../../utils/generateToken.js";
import { comparePassword, hashPassword } from "../../utils/hashPassword.js";
import { findAuthUserByEmail, findAuthUserById, insertAuthUser } from "./auth.repository.js";

const buildAuthResponse = (user) => {
  return {
    user,
    token: generateToken(user),
  };
};

export const register = async ({ name, email, password, role }) => {
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    throw new AppError("A user with this email already exists.", 409, "EMAIL_ALREADY_USED");
  }

  const passwordHash = await hashPassword(password);
  const userId = await insertAuthUser({ name, email, passwordHash, role });
  const user = await findAuthUserById(userId);

  return buildAuthResponse(user);
};

export const login = async ({ email, password }) => {
  const user = await findAuthUserByEmail(email, { includePassword: true });

  if (!user) {
    throw new AppError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
  }

  const { passwordHash, ...safeUser } = user;
  return buildAuthResponse(safeUser);
};

export const getAuthUserById = async (id) => {
  const user = await findAuthUserById(id);

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  return user;
};

