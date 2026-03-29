import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getwalletStatus } from "./wallet.controller.js";

const router = Router();

router.get("/status", asyncHandler(getwalletStatus));

export default router;
