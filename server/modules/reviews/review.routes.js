import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getreviewStatus } from "./review.controller.js";

const router = Router();

router.get("/status", asyncHandler(getreviewStatus));

export default router;
