import { createUser, ensureUsersTable, findUserByEmail, findUserById } from "../users/user.repository.js";

export const prepareAuthStorage = async () => {
  await ensureUsersTable();
};

export const insertAuthUser = async ({ name, email, passwordHash, role }) => {
  return createUser({ name, email, passwordHash, role });
};

export const findAuthUserByEmail = async (email, { includePassword = false } = {}) => {
  return findUserByEmail(email, { includePassword });
};

export const findAuthUserById = async (id) => {
  return findUserById(id);
};

