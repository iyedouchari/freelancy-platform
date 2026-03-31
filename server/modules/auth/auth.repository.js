import { createUser, ensureUsersTable, findUserByEmail, findUserById } from "../users/user.repository.js";

export const prepareAuthStorage = async () => {
  await ensureUsersTable();
};

export const insertAuthUser = async ({
  name,
  company,
  title,
  location,
  email,
  phone,
  passwordHash,
  role,
}) => {
  return createUser({ name, company, title, location, email, phone, passwordHash, role });
};

export const findAuthUserByEmail = async (email, { includePassword = false } = {}) => {
  return findUserByEmail(email, { includePassword });
};

export const findAuthUserById = async (id) => {
  return findUserById(id);
};

