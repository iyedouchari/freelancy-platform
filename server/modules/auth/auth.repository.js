import { getDb } from "../../config/db.js";
import { hashPassword } from "../../utils/hashPassword.js";
import { createUser, ensureUsersTable, findUserByEmail, findUserById } from "../users/user.repository.js";

const DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "987654321";
const DEFAULT_ADMIN_PROFILE = {
  name: "Platform Admin",
  company: "Freelancy",
  title: "Administrator",
  location: "Tunis",
  phone: "00000000",
};

export const ensureDefaultAdminAccount = async () => {
  const db = getDb();
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const existingAdmin = await findUserByEmail(DEFAULT_ADMIN_EMAIL, { includePassword: true });

  if (!existingAdmin) {
    await createUser({
      ...DEFAULT_ADMIN_PROFILE,
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    });
    return;
  }

  await db.query(
    `
      UPDATE users
      SET
        name = ?,
        company = ?,
        professional_title = ?,
        location = ?,
        phone = ?,
        password = ?,
        role = 'ADMIN',
        is_suspended = FALSE,
        suspension_reason = NULL,
        suspended_until = NULL
      WHERE email = ?
      LIMIT 1
    `,
    [
      DEFAULT_ADMIN_PROFILE.name,
      DEFAULT_ADMIN_PROFILE.company,
      DEFAULT_ADMIN_PROFILE.title,
      DEFAULT_ADMIN_PROFILE.location,
      DEFAULT_ADMIN_PROFILE.phone,
      passwordHash,
      DEFAULT_ADMIN_EMAIL,
    ],
  );
};

export const prepareAuthStorage = async () => {
  await ensureUsersTable();
  await ensureDefaultAdminAccount();
};

export const insertAuthUser = async ({
  name,
  company,
  title,
  location,
  email,
  phone,
  bio,
  avatarUrl,
  passwordHash,
  role,
}) => {
  return createUser({
    name,
    company,
    title,
    location,
    email,
    phone,
    bio,
    avatarUrl,
    passwordHash,
    role,
  });
};

export const findAuthUserByEmail = async (email, { includePassword = false } = {}) => {
  return findUserByEmail(email, { includePassword });
};

export const findAuthUserById = async (id) => {
  return findUserById(id);
};
