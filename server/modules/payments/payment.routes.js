import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import {
  getPaymentsByDeal,
  payAdvance,
  payFinal,
  payTotal,
  refundPayment,
} from "./payment.controller.js";
import {
  validateAdvancePayment,
  validateFinalPayment,
  validateRefund,
  validateTotalPayment,
} from "./payment.validation.js";

const router = Router();

router.get("/deal/:dealId", authMiddleware, getPaymentsByDeal);
router.post("/advance", authMiddleware, validateAdvancePayment, payAdvance);
router.post("/final", authMiddleware, validateFinalPayment, payFinal);
router.post("/total", authMiddleware, validateTotalPayment, payTotal);
router.post("/:paymentId/refund", authMiddleware, validateRefund, refundPayment);

export default router;
