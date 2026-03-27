import bcrypt from "bcryptjs";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createUser,
  getUserByEmail,
  getUserById,
} from "../repositories/userRepository.js";
import { signAccessToken } from "../utils/tokenUtils.js";
import { isValidEmail, isValidPassword, sanitizeUser } from "../utils/userUtils.js";

const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
  const { name, email, password, role, bio, fields, profileImage } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "name, email and password are required.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: "Password must contain at least 6 characters.",
    });
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    name,
    email,
    passwordHash,
    role,
    bio,
    fields,
    profileImage,
  });

  const token = signAccessToken(user);

  return res.status(201).json({
    token,
    user: sanitizeUser(user),
  });
});

authRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required.",
    });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = signAccessToken(user);
  return res.json({
    token,
    user: sanitizeUser(user),
  });
});

authRoutes.get("/profile", authMiddleware, async (req, res) => {
  const user = await getUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ user: sanitizeUser(user) });
});

export default authRoutes;
