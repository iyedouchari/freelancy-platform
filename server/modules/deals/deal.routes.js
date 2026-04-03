import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { getDealById, getdealStatus, listDeals } from "./deal.controller.js";

const router = Router();

router.get("/status", asyncHandler(getdealStatus));
router.use(authenticate);
router.get("/", asyncHandler(listDeals));
router.get("/:id", asyncHandler(getDealById));

export default router;
