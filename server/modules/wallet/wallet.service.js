import db from "../../config/db.js";
import { dealRepository } from "../deals/deal.repository.js";
import * as paymentService from "../payments/payment.service.js";
import { stripeDummy } from "../payments/payment.service.js";
import * as walletRepo from "./wallet.repository.js";

const formatDealDate = (value) => {
  if (!value) {
    return "date limite indisponible";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "date limite indisponible";
  }

  return parsed.toLocaleDateString("fr-FR");
};

const mapWalletTransaction = (transaction) => {
  const title = transaction.request_title || (transaction.deal_id ? `Deal #${transaction.deal_id}` : "Wallet");

  const labels = {
    topup: {
      label: "Recharge portefeuille",
      detail: "Ajout manuel de fonds sur le wallet",
      status: "Traite",
    },
    refund: {
      label: "Retrait wallet",
      detail: "Retrait ou remboursement traite depuis le wallet",
      status: "Traite",
    },
    advance_debit: {
      label: "Paiement avance",
      detail: `Avance de 30% payee pour ${title}`,
      status: "Paye",
    },
    advance_credit: {
      label: "Avance recue",
      detail: `Avance de 30% recue pour ${title}`,
      status: "Disponible",
    },
    final_debit: {
      label: "Paiement final",
      detail: `Solde final paye pour ${title}`,
      status: "Paye",
    },
    final_credit: {
      label: "Paiement final recu",
      detail: `Solde final recu pour ${title}`,
      status: "Disponible",
    },
    penalty: {
      label: "Ajustement",
      detail: `Ajustement financier sur ${title}`,
      status: "Traite",
    },
  };

  const meta = labels[String(transaction.type || "")] || {
    label: title,
    detail: "Mouvement wallet",
    status: "Traite",
  };

  return {
    ...transaction,
    amount: Number(transaction.amount),
    label: meta.label,
    detail: meta.detail,
    status: meta.status,
    date: transaction.created_at,
  };
};

export async function getWalletWithTransactions(userId) {
  const wallet = await walletRepo.findWalletByOwnerId(userId);
  if (!wallet) throw new Error("Wallet introuvable.");

  const transactions = await walletRepo.findTransactionsByWalletId(wallet.id);
  return { wallet, transactions: transactions.map(mapWalletTransaction) };
}

export async function topupWallet({ userId, amount }) {
  if (!amount || Number(amount) <= 0) {
    throw new Error("Montant de recharge invalide.");
  }

  const wallet = await walletRepo.findWalletByOwnerId(userId);
  if (!wallet) throw new Error("Wallet introuvable.");

  await stripeDummy({ amount, metadata: { userId, purpose: "topup" } });

  const balanceBefore = Number(wallet.balance);
  await walletRepo.creditWallet(userId, amount);
  const balanceAfter = balanceBefore + Number(amount);

  const tx = await walletRepo.createTransaction({
    walletId: wallet.id,
    type: "topup",
    amount,
    balanceBefore,
    balanceAfter,
  });

  return { transaction: mapWalletTransaction(tx), newBalance: balanceAfter };
}

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
    walletId: wallet.id,
    type: "refund",
    amount,
    balanceBefore,
    balanceAfter,
  });

  return {
    transaction: mapWalletTransaction(tx),
    newBalance: balanceAfter,
    bankAccountMasked,
  };
}

async function findClientDealById({ dealId, clientId }) {
  const [rows] = await db.query(
    `SELECT id, client_id, freelancer_id, final_price, advance_amount, status, deadline
     FROM deals
     WHERE id = ? AND client_id = ?`,
    [dealId, clientId],
  );
  return rows[0] ?? null;
}

export async function getDealPaymentSummary({ dealId, clientId }) {
  const deal = await findClientDealById({ dealId, clientId });
  if (!deal) {
    throw new Error(`Deal introuvable (ID: ${dealId}) pour ce client (ID: ${clientId}).`);
  }

  const payments = await paymentService.getPaymentsByDeal(dealId);
  const advancePayment = payments.find((p) => p.payment_type === "Avance" && p.status === "Paye");
  const finalPayment = payments.find((p) => p.payment_type === "Paiement final" && p.status === "Paye");

  const advanceAmount = Number(deal.advance_amount);
  const finalAmount = Math.max(0, Number(deal.final_price) - advanceAmount);

  return {
    deal: {
      id: deal.id,
      status: deal.status,
      finalPrice: Number(deal.final_price),
      advanceAmount,
      finalAmount,
    },
    progress: {
      advancePaid: Boolean(advancePayment),
      finalPaid: Boolean(finalPayment),
    },
    payments,
  };
}

export async function payDealAdvance({ dealId, clientId }) {
  const deal = await findClientDealById({ dealId, clientId });
  if (!deal) {
    throw new Error(`Deal introuvable (ID: ${dealId}) pour ce client (ID: ${clientId}).`);
  }

  const result = await paymentService.payAdvance({
    dealId,
    clientId,
    freelancerId: Number(deal.freelancer_id),
    amount: Number(deal.advance_amount),
  });

  return {
    ...result,
    deal: await dealRepository.findById(dealId),
  };
}

export async function payDealFinal({ dealId, clientId, amount = null }) {
  const deal = await findClientDealById({ dealId, clientId });
  if (!deal) {
    throw new Error(`Deal introuvable (ID: ${dealId}) pour ce client (ID: ${clientId}).`);
  }

  const resolvedAmount =
    amount && Number(amount) > 0
      ? Number(amount)
      : Math.max(0, Number(deal.final_price) - Number(deal.advance_amount));

  const result = await paymentService.payFinal({
    dealId,
    clientId,
    freelancerId: Number(deal.freelancer_id),
    amount: resolvedAmount,
  });

  return {
    ...result,
    deal: await dealRepository.findById(dealId),
  };
}

export async function payDealTotal({ dealId, clientId }) {
  const deal = await findClientDealById({ dealId, clientId });
  if (!deal) {
    throw new Error(`Deal introuvable (ID: ${dealId}) pour ce client (ID: ${clientId}).`);
  }

  const result = await paymentService.payTotal({
    dealId,
    clientId,
    freelancerId: Number(deal.freelancer_id),
    totalAmount: Number(deal.final_price),
    advanceAmount: Number(deal.advance_amount),
    deadline: deal.deadline,
  });

  return {
    ...result,
    deal: await dealRepository.findById(dealId),
    comment: `Montant total paye avant le ${formatDealDate(deal.deadline)}.`,
  };
}
