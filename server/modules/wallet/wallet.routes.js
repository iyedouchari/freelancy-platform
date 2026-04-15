import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  getDealPaymentSummary,
  getMyTransactions,
  getMyWallet,
  getwalletStatus,
  payDealAdvance,
  payDealFinal,
  payDealTotal,
  topupWallet,
  withdrawWallet,
} from "./wallet.controller.js";
import {
  validateDealIdParam,
  validateDealTotalPayment,
  validateOptionalFinalAmount,
  validateTopup,
  validateWithdraw,
} from "./wallet.validation.js";

const router = Router();

router.get("/", authMiddleware, getMyWallet);
router.get("/transactions", authMiddleware, getMyTransactions);
router.post("/topup", authMiddleware, validateTopup, topupWallet);
router.post("/withdraw", authMiddleware, validateWithdraw, withdrawWallet);
router.get("/deals/:dealId/summary", authMiddleware, validateDealIdParam, getDealPaymentSummary);
router.post("/deals/:dealId/pay-advance", authMiddleware, validateDealIdParam, payDealAdvance);
router.post("/deals/:dealId/pay-final", authMiddleware, validateDealIdParam, validateOptionalFinalAmount, payDealFinal);
router.post("/deals/:dealId/pay-total", authMiddleware, validateDealTotalPayment, payDealTotal);
router.get("/status", asyncHandler(getwalletStatus));

export default router;
