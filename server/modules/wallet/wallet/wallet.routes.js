// ─── wallet.routes.js ─────────────────────────────────────────────────────────
// Routes /api/wallet
//
// Dans app.js :
//   import walletRoutes from "./modules/wallet/wallet.routes.js";
//   app.use("/api/wallet", walletRoutes);

import { Router } from "express";
import { authMiddleware }  from "../../middleware/authMiddleware.js";
import { getMyWallet, topupWallet, withdrawWallet } from "./wallet/wallet.controller.js";
import { validateTopup, validateWithdraw } from "./wallet.validation.js";

const router = Router();

// GET  /api/wallet           → solde + historique
// POST /api/wallet/topup     → recharger le solde (client)
// POST /api/wallet/withdraw  → retrait bancaire (freelancer)

router.get(  "/",         authMiddleware, getMyWallet);
router.post( "/topup",    authMiddleware, validateTopup,    topupWallet);
router.post( "/withdraw", authMiddleware, validateWithdraw, withdrawWallet);

export default router;