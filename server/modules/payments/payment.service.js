// ─── payment.service.js ───────────────────────────────────────────────────────
// Logique métier des paiements : acompte (Avance), paiement final, remboursement.
// Adapté au schéma du groupe.
//
// ⚠️  Les triggers MySQL font le travail automatiquement :
//   - trig_after_payment_update → change deal.status quand payment.status = 'Paye'
//   - trig_after_proposal_accept → crée le deal quand proposal.status = 'Acceptee'
//
// Ce service s'occupe uniquement de :
//   1. Débiter/créditer les wallets
//   2. Créer les transactions wallet
//   3. Mettre à jour le statut du paiement → le trigger fait le reste

import * as paymentRepo from "./payment.repository.js";
import * as walletRepo  from "../wallet/wallet.repository.js";

// ─── Stripe Dummy (exporté pour wallet.service.js) ───────────────────────────

export async function stripeDummy({ amount, metadata = {} }) {
  await new Promise((r) => setTimeout(r, 300));
  if (Math.random() < 0.05) {
    throw new Error("STRIPE_ERROR: Paiement refusé par la banque émettrice.");
  }
  return {
    id:      `pi_dummy_${Date.now()}`,
    amount,
    status:  "succeeded",
    metadata,
    created: new Date().toISOString(),
  };
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

export async function getPaymentsByDeal(dealId) {
  return paymentRepo.findPaymentsByDealId(dealId);
}

// ─── Acompte — 'Avance' ───────────────────────────────────────────────────────
// Appelé quand le client veut payer l'acompte du deal.
// Le deal est déjà créé par le trigger trig_after_proposal_accept.
// L'acompte = deals.advance_amount (calculé par le Membre 3).

export async function payAdvance({ dealId, clientId, freelancerId, amount }) {
  // 1. Vérifier le wallet client
  const clientWallet = await walletRepo.findWalletByOwnerId(clientId);
  if (!clientWallet) throw new Error("Wallet client introuvable.");
  if (Number(clientWallet.balance) < Number(amount)) {
    throw new Error("Solde insuffisant pour payer l'acompte.");
  }

  // 2. Créer le paiement en DB (status: 'En attente')
  const payment = await paymentRepo.createPayment({
    dealId,
    clientId,
    freelancerId,
    amount,
    paymentType: "Avance",
  });

  // 3. Appel Stripe dummy
  await stripeDummy({ amount, metadata: { dealId, type: "Avance", clientId } });

  // 4. Débiter le wallet client
  const clientBalanceBefore = Number(clientWallet.balance);
  await walletRepo.debitWallet(clientId, amount);
  const clientBalanceAfter = clientBalanceBefore - Number(amount);

  await walletRepo.createTransaction({
    walletId:      clientWallet.id,
    dealId,
    type:          "advance_debit",
    amount,
    balanceBefore: clientBalanceBefore,
    balanceAfter:  clientBalanceAfter,
  });

  // 5. Créditer le wallet freelancer
  const freelancerWallet = await walletRepo.findWalletByOwnerId(freelancerId);
  const freelancerBalanceBefore = Number(freelancerWallet.balance);
  await walletRepo.creditWallet(freelancerId, amount);
  const freelancerBalanceAfter = freelancerBalanceBefore + Number(amount);

  await walletRepo.createTransaction({
    walletId:      freelancerWallet.id,
    dealId,
    type:          "advance_credit",
    amount,
    balanceBefore: freelancerBalanceBefore,
    balanceAfter:  freelancerBalanceAfter,
  });

  // 6. Marquer le paiement comme 'Paye'
  // → le trigger trig_after_payment_update met deal.status = 'Actif' automatiquement
  await paymentRepo.updatePaymentStatus(payment.id, "Paye");

  return { payment: { ...payment, status: "Paye" } };
}

// ─── Paiement final — 'Paiement final' ───────────────────────────────────────
// Appelé quand le client valide la livraison.
// → le trigger met deal.status = 'Termine' automatiquement.

export async function payFinal({ dealId, clientId, freelancerId, amount }) {
  // 1. Vérifier le wallet client
  const clientWallet = await walletRepo.findWalletByOwnerId(clientId);
  if (!clientWallet) throw new Error("Wallet client introuvable.");
  if (Number(clientWallet.balance) < Number(amount)) {
    throw new Error("Solde insuffisant pour le paiement final.");
  }

  // 2. Créer le paiement
  const payment = await paymentRepo.createPayment({
    dealId,
    clientId,
    freelancerId,
    amount,
    paymentType: "Paiement final",
  });

  // 3. Stripe dummy
  await stripeDummy({ amount, metadata: { dealId, type: "Paiement final", clientId } });

  // 4. Débiter client
  const clientBalanceBefore = Number(clientWallet.balance);
  await walletRepo.debitWallet(clientId, amount);
  const clientBalanceAfter = clientBalanceBefore - Number(amount);

  await walletRepo.createTransaction({
    walletId:      clientWallet.id,
    dealId,
    type:          "final_debit",
    amount,
    balanceBefore: clientBalanceBefore,
    balanceAfter:  clientBalanceAfter,
  });

  // 5. Créditer freelancer
  const freelancerWallet = await walletRepo.findWalletByOwnerId(freelancerId);
  const freelancerBalanceBefore = Number(freelancerWallet.balance);
  await walletRepo.creditWallet(freelancerId, amount);
  const freelancerBalanceAfter = freelancerBalanceBefore + Number(amount);

  await walletRepo.createTransaction({
    walletId:      freelancerWallet.id,
    dealId,
    type:          "final_credit",
    amount,
    balanceBefore: freelancerBalanceBefore,
    balanceAfter:  freelancerBalanceAfter,
  });

  // 6. Marquer 'Paye'
  // → trigger met deal.status = 'Termine' et deals.final_paid_at = NOW()
  await paymentRepo.updatePaymentStatus(payment.id, "Paye");

  return { payment: { ...payment, status: "Paye" } };
}

// ─── Remboursement ────────────────────────────────────────────────────────────
// → trigger met deal.status = 'Annule' automatiquement.

export async function refundPayment({ paymentId, clientId }) {
  const payment = await paymentRepo.findPaymentById(paymentId);
  if (!payment) throw new Error("Paiement introuvable.");
  if (payment.status !== "Paye") {
    throw new Error("Seuls les paiements payés peuvent être remboursés.");
  }

  // Rembourser le client
  const clientWallet = await walletRepo.findWalletByOwnerId(clientId);
  const balanceBefore = Number(clientWallet.balance);
  await walletRepo.creditWallet(clientId, payment.amount);
  const balanceAfter = balanceBefore + Number(payment.amount);

  await walletRepo.createTransaction({
    walletId:      clientWallet.id,
    dealId:        payment.deal_id,
    type:          "refund",
    amount:        payment.amount,
    balanceBefore,
    balanceAfter,
  });

  // Marquer 'Rembourse' → trigger met deal.status = 'Annule'
  await paymentRepo.updatePaymentStatus(paymentId, "Rembourse");

  return { refunded: true, amount: payment.amount };
}