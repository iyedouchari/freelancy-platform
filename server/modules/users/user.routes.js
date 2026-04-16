import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { changeMyPassword, getMe, getUserById, updateMe } from "./user.controller.js";
import { validateUserIdParam } from "./user.validation.js";

const router = Router();

router.get("/me", authMiddleware, asyncHandler(getMe));
router.patch("/me", authMiddleware, asyncHandler(updateMe));
router.patch("/me/password", authMiddleware, asyncHandler(changeMyPassword));
router.get("/:id", authMiddleware, validateRequest(validateUserIdParam, "params"), asyncHandler(getUserById));

export default router;

