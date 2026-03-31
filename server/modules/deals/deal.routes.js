import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getdealStatus } from "./deal.controller.js";

const router = Router();

router.get("/status", asyncHandler(getdealStatus));

export default router;
