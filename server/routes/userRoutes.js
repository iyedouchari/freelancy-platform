import bcrypt from "bcryptjs";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createUser,
  deleteUserById,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUserById,
} from "../repositories/userRepository.js";
import { isValidEmail, isValidPassword, sanitizeUser } from "../utils/userUtils.js";

const userRoutes = Router();

userRoutes.use(authMiddleware);

userRoutes.get("/", async (_req, res) => {
  const users = await getAllUsers();
  return res.json({ users: users.map(sanitizeUser) });
});

userRoutes.get("/:id", async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ user: sanitizeUser(user) });
});

userRoutes.post("/", async (req, res) => {
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
  const newUser = await createUser({
    name,
    email,
    passwordHash,
    role,
    bio,
    fields,
    profileImage,
  });

  return res.status(201).json({ user: sanitizeUser(newUser) });
});

userRoutes.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, bio, fields, profileImage } = req.body || {};

  const currentUser = await getUserById(id);
  if (!currentUser) {
    return res.status(404).json({ message: "User not found." });
  }

  if (email) {
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== id) {
      return res.status(409).json({ message: "Email already in use." });
    }
  }

  const updatePayload = {};

  if (typeof name === "string") updatePayload.name = name.trim();
  if (typeof email === "string") updatePayload.email = email;
  if (typeof role === "string") {
    updatePayload.role = role === "client" ? "client" : role === "admin" ? "admin" : "freelancer";
  }
  if (typeof bio === "string") updatePayload.bio = bio;
  if (Array.isArray(fields)) updatePayload.fields = fields;
  if (profileImage !== undefined) updatePayload.profileImage = profileImage;

  if (password !== undefined) {
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters.",
      });
    }
    updatePayload.passwordHash = await bcrypt.hash(password, 10);
  }

  const updatedUser = await updateUserById(id, updatePayload);
  return res.json({ user: sanitizeUser(updatedUser) });
});

userRoutes.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userToDelete = await getUserById(id);

  if (!userToDelete) {
    return res.status(404).json({ message: "User not found." });
  }

  await deleteUserById(id);
  return res.status(204).send();
});

export default userRoutes;
