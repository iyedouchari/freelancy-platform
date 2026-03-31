import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { loginController, logoutController, meController, registerController } from "./auth.controller.js";
import { validateLoginPayload, validateRegisterPayload } from "./auth.validation.js";

const router = Router();

router.post("/register", validateRequest(validateRegisterPayload), asyncHandler(registerController));
router.post("/login", validateRequest(validateLoginPayload), asyncHandler(loginController));
router.get("/me", authMiddleware, asyncHandler(meController));
router.post("/logout", authMiddleware, asyncHandler(logoutController));

export default router;

