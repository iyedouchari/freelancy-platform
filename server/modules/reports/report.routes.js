import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { createReport, listMyReports } from "./report.controller.js";
import { createReportSchema } from "./report.validation.js";

const router = Router();

router.use(authMiddleware);

router.get("/my", asyncHandler(listMyReports));
router.post("/", validateRequest(createReportSchema), asyncHandler(createReport));

export default router;
