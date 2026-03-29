import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getpaymentStatus } from "./payment.controller.js";

const router = Router();

router.get("/status", asyncHandler(getpaymentStatus));

export default router;
