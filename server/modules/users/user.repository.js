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
    company: row.company,
    title: row.professional_title,
    location: row.location,
    email: row.email,
    phone: row.phone,
    role: normalizeRoleFromDb(row.role),
    isSuspended: Boolean(row.is_suspended),
    suspensionReason: row.suspension_reason || "",
    suspendedUntil: row.suspended_until || "",
    suspensionDurationDays: row.suspension_duration_days ? Number(row.suspension_duration_days) : null,
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
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('FREELANCER', 'CLIENT', 'ADMIN') NOT NULL,
      company VARCHAR(120) DEFAULT NULL,
      professional_title VARCHAR(120) DEFAULT NULL,
      location VARCHAR(120) DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      bio VARCHAR(500) DEFAULT NULL,
      avatar_url VARCHAR(500) DEFAULT NULL,
      points INT NOT NULL DEFAULT 0,
      is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_email CHECK (email LIKE '%@%.%'),
      CONSTRAINT chk_password CHECK (CHAR_LENGTH(password) >= 10)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migration-safe additions for MySQL versions that do not support IF NOT EXISTS in ADD COLUMN.
  const addColumnIfMissing = async (columnName, columnDefinition) => {
    const [rows] = await db.query("SHOW COLUMNS FROM users LIKE ?", [columnName]);
    if (rows.length === 0) {
      await db.query(`ALTER TABLE users ADD COLUMN ${columnDefinition}`);
    }
  };

  await addColumnIfMissing("company", "company VARCHAR(120) DEFAULT NULL");
  await addColumnIfMissing(
    "professional_title",
    "professional_title VARCHAR(120) DEFAULT NULL",
  );
  await addColumnIfMissing("location", "location VARCHAR(120) DEFAULT NULL");
  await addColumnIfMissing("phone", "phone VARCHAR(30) DEFAULT NULL");
  await addColumnIfMissing("is_suspended", "is_suspended BOOLEAN NOT NULL DEFAULT FALSE");
  await addColumnIfMissing("suspension_reason", "suspension_reason VARCHAR(255) DEFAULT NULL");
  await addColumnIfMissing("suspended_until", "suspended_until TIMESTAMP NULL DEFAULT NULL");
  await addColumnIfMissing("suspension_duration_days", "suspension_duration_days INT NULL DEFAULT NULL");
};

export const createUser = async ({
  name,
  company,
  title,
  location,
  email,
  phone,
  passwordHash,
  role,
}) => {
  const db = getDb();
  const [result] = await db.query(
    "INSERT INTO users (name, company, professional_title, location, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [name, company || null, title, location, email, phone, passwordHash, normalizeRoleForDb(role)],
  );

  return result.insertId;
};

export const findUserByEmail = async (email, { includePassword = false } = {}) => {
  const db = getDb();
  const [rows] = await db.query(
    "SELECT id, name, company, professional_title, location, email, phone, role, password AS password_hash, is_suspended, suspension_reason, suspended_until, suspension_duration_days, created_at FROM users WHERE email = ? LIMIT 1",
    [email],
  );

  return mapUserRow(rows[0], { includePassword });
};

export const findUserById = async (id) => {
  const db = getDb();
  const [rows] = await db.query(
    "SELECT id, name, company, professional_title, location, email, phone, role, is_suspended, suspension_reason, suspended_until, suspension_duration_days, created_at FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  return mapUserRow(rows[0]);
};
