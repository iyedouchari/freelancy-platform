// ─── wallet.controller.js ────────────────────────────────────────────────────
// Reçoit req/res pour les endpoints /api/wallet.

import * as walletService from "../wallet.service.js";

/**
 * GET /api/wallet
 * Retourne le wallet + historique transactions de l'utilisateur connecté.
 */
export async function getMyWallet(req, res) {
  try {
    const data = await walletService.getWalletWithTransactions(req.user.id);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/wallet/topup
 * Body : { amount: number }
 * Recharge le solde du client via API de paiement.
 */
export async function topupWallet(req, res) {
  try {
    const amount = Number(req.body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Montant invalide." });
    }

    const result = await walletService.topupWallet({
      userId: req.user.id,
      amount,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

/**
 * POST /api/wallet/withdraw
 * Body : { amount: number, bankAccountMasked: string }
 * Demande de retrait pour le freelancer.
 */
export async function withdrawWallet(req, res) {
  try {
    const amount = Number(req.body.amount);
    const { bankAccountMasked } = req.body;

    if (!amount || isNaN(amount) || amount < 100) {
      return res.status(400).json({ message: "Montant minimum de retrait : 100 DT." });
    }

    const result = await walletService.withdrawWallet({
      userId: req.user.id,
      amount,
      bankAccountMasked,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}