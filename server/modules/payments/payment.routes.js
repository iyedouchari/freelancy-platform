// ─── payment.routes.js ───────────────────────────────────────────────────────
// Routes /api/payments
//
// Dans app.js :
//   import paymentRoutes from "./modules/payments/payment.routes.js";
//   app.use("/api/payments", paymentRoutes);

import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import {
  getPaymentsByDeal,
  payAdvance,
  payFinal,
  refundPayment,
} from "./payment.controller.js";
import {
  validateAdvancePayment,
  validateFinalPayment,
  validateRefund,
} from "./payment.validation.js";

const router = Router();

// GET  /api/payments/deal/:dealId      → paiements d'un deal
// POST /api/payments/advance           → payer l'acompte (client)
// POST /api/payments/final             → payer le solde final (client)
// POST /api/payments/:paymentId/refund → rembourser (client)

router.get(  "/deal/:dealId",        authMiddleware, getPaymentsByDeal);
router.post( "/advance",             authMiddleware, validateAdvancePayment, payAdvance);
router.post( "/final",               authMiddleware, validateFinalPayment,   payFinal);
router.post( "/:paymentId/refund",   authMiddleware, validateRefund,         refundPayment);

export default router;