import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { getMe, getUserById } from "./user.controller.js";
import { validateUserIdParam } from "./user.validation.js";

const router = Router();

router.get("/me", authMiddleware, asyncHandler(getMe));
router.get("/:id", authMiddleware, validateRequest(validateUserIdParam, "params"), asyncHandler(getUserById));

export default router;

