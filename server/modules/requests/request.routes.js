import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getrequestStatus } from "./request.controller.js";

const router = Router();

router.get("/status", asyncHandler(getrequestStatus));

export default router;
