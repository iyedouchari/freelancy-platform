import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getwalletStatus } from "./wallet.controller.js";


import { authMiddleware }  from "../../middleware/authMiddleware.js";
import { getMyWallet, topupWallet, withdrawWallet } from "./wallet.controller.js";
import { validateTopup, validateWithdraw } from "./wallet.validation.js";

const router = Router();


router.get(  "/",         authMiddleware, getMyWallet);
router.post( "/topup",    authMiddleware, validateTopup,    topupWallet);
router.post( "/withdraw", authMiddleware, validateWithdraw, withdrawWallet);
router.get("/status", asyncHandler(getwalletStatus));
export default router;



