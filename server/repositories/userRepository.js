import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.resolve(DATA_DIR, "users.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf8");
  }
}

async function readUsers() {
  await ensureDataFile();
  const raw = await fs.readFile(USERS_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function getAllUsers() {
  return readUsers();
}

export async function getUserById(id) {
  const users = await readUsers();
  return users.find((user) => user.id === id) || null;
}

export async function getUserByEmail(email) {
  const users = await readUsers();
  const normalizedEmail = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

export async function createUser({
  name,
  email,
  passwordHash,
  role = "freelancer",
  bio = "",
  fields = [],
  profileImage = null,
}) {
  const users = await readUsers();
  const now = new Date().toISOString();
  const newUser = {
    id: crypto.randomUUID(),
    name: String(name || "").trim(),
    email: normalizeEmail(email),
    passwordHash,
    role: role === "client" ? "client" : role === "admin" ? "admin" : "freelancer",
    bio: String(bio || ""),
    fields: Array.isArray(fields) ? fields : [],
    profileImage,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await writeUsers(users);
  return newUser;
}

export async function updateUserById(id, updates) {
  const users = await readUsers();
  const userIndex = users.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    return null;
  }

  const existingUser = users[userIndex];
  const updatedUser = {
    ...existingUser,
    ...updates,
    email: updates.email ? normalizeEmail(updates.email) : existingUser.email,
    updatedAt: new Date().toISOString(),
  };

  users[userIndex] = updatedUser;
  await writeUsers(users);
  return updatedUser;
}

export async function deleteUserById(id) {
  const users = await readUsers();
  const userIndex = users.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    return false;
  }

  users.splice(userIndex, 1);
  await writeUsers(users);
  return true;
}
