import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getchatStatus } from "./chat.controller.js";

const router = Router();

router.get("/status", asyncHandler(getchatStatus));

export default router;
