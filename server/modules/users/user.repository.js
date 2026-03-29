import { getDb } from "../../config/db.js";

const normalizeRoleFromDb = (role) => {
  return String(role || "").toLowerCase();
};

const normalizeRoleForDb = (role) => {
  return String(role || "freelancer").toUpperCase();
};

const mapUserRow = (row, { includePassword = false } = {}) => {
  if (!row) {
    return null;
  }

  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: normalizeRoleFromDb(row.role),
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };

  if (includePassword) {
    user.passwordHash = row.password_hash || row.password;
  }

  return user;
};

export const ensureUsersTable = async () => {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('FREELANCER', 'CLIENT', 'ADMIN') NOT NULL DEFAULT 'FREELANCER',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

export const createUser = async ({ name, email, passwordHash, role }) => {
  const db = getDb();
  const [result] = await db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [
    name,
    email,
    passwordHash,
    normalizeRoleForDb(role),
  ]);

  return result.insertId;
};

export const findUserByEmail = async (email, { includePassword = false } = {}) => {
  const db = getDb();
  const [rows] = await db.query(
    "SELECT id, name, email, role, password AS password_hash, created_at FROM users WHERE email = ? LIMIT 1",
    [email],
  );

  return mapUserRow(rows[0], { includePassword });
};

export const findUserById = async (id) => {
  const db = getDb();
  const [rows] = await db.query("SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1", [id]);
  return mapUserRow(rows[0]);
};
