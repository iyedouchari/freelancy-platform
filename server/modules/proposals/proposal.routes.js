import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getproposalStatus } from "./proposal.controller.js";

const router = Router();

router.get("/status", asyncHandler(getproposalStatus));

export default router;
