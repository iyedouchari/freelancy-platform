// ─── wallet.service.js ────────────────────────────────────────────────────────
// Logique métier du portefeuille : solde, topup, retrait.
// Adapté au schéma du groupe.

import * as walletRepo from "./wallet/wallet.repository.js";
import { stripeDummy } from "../payments/payment.service.js";

// ─── Lecture ──────────────────────────────────────────────────────────────────

export async function getWalletWithTransactions(userId) {
  const wallet = await walletRepo.findWalletByOwnerId(userId);
  if (!wallet) throw new Error("Wallet introuvable.");

  const transactions = await walletRepo.findTransactionsByWalletId(wallet.id);
  return { wallet, transactions };
}

// ─── Topup (recharge) ─────────────────────────────────────────────────────────

export async function topupWallet({ userId, amount }) {
  if (!amount || Number(amount) <= 0) {
    throw new Error("Montant de recharge invalide.");
  }

  const wallet = await walletRepo.findWalletByOwnerId(userId);
  if (!wallet) throw new Error("Wallet introuvable.");

  // Appel API paiement externe
  await stripeDummy({ amount, metadata: { userId, purpose: "topup" } });

  const balanceBefore = Number(wallet.balance);
  await walletRepo.creditWallet(userId, amount);
  const balanceAfter = balanceBefore + Number(amount);

  const tx = await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          "topup",
    amount,
    balanceBefore,
    balanceAfter,
  });

  return { transaction: tx, newBalance: balanceAfter };
}

// ─── Retrait (freelancer) ─────────────────────────────────────────────────────

export async function withdrawWallet({ userId, amount, bankAccountMasked }) {
  if (!amount || Number(amount) < 100) {
    throw new Error("Montant minimum de retrait : 100 DT.");
  }

  const wallet = await walletRepo.findWalletByOwnerId(userId);
  if (!wallet) throw new Error("Wallet introuvable.");

  if (Number(wallet.balance) < Number(amount)) {
    throw new Error("Solde insuffisant pour effectuer ce retrait.");
  }

  const balanceBefore = Number(wallet.balance);
  await walletRepo.debitWallet(userId, amount);
  const balanceAfter = balanceBefore - Number(amount);

  const tx = await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          "refund",   // type retrait = refund dans le schéma
    amount,
    balanceBefore,
    balanceAfter,
  });

  return { transaction: tx, newBalance: balanceAfter };
}