import db from "../../config/db.js";
import { dealRepository } from "../deals/deal.repository.js";
import * as paymentService from "../payments/payment.service.js";
import { stripeDummy } from "../payments/payment.service.js";
import * as walletRepo from "./wallet.repository.js";
// Permet de formater une date de deal de manière conviviale pour l'affichage, en vérifiant que la valeur est valide et en la formatant selon les conventions françaises, ou en retournant un message d'indisponibilité si la date n'est pas valide
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
// Permet de mapper une transaction de portefeuille en un format plus convivial pour l'affichage, en utilisant des étiquettes et des détails basés sur le type de transaction, et en formatant les montants et les dates de manière appropriée
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
    penalty_debit: {
      label: "Penalite retard",
      detail: `Penalite de retard deduite pour ${title}`,
      status: "Traite",
    },
    penalty_credit: {
      label: "Compensation retard",
      detail: `Compensation de retard creditee pour ${title}`,
      status: "Disponible",
    },
    submission_release: {
      label: "Paiement libere",
      detail: `Paiement libere a la soumission pour ${title}`,
      status: "Disponible",
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


async function reconcileFreelancerReleasedPayments(userId) {
  const [rows] = await db.query(
    `SELECT d.id
     FROM deals d
     WHERE d.freelancer_id = ?
       AND d.submitted_at IS NOT NULL
       AND d.status <> 'Annule'
       AND EXISTS (
         SELECT 1
         FROM payments p
         WHERE p.deal_id = d.id
           AND p.status = 'Paye'
       )
     ORDER BY d.id DESC`,
    [userId],
  );

  for (const row of rows) {
    try {
      await paymentService.releaseAdvancePaymentOnDeadline({ dealId: Number(row.id) });
      await paymentService.releaseFreelancerPaymentOnSubmission({ dealId: Number(row.id) });
    } catch (error) {
      console.error(`Erreur reconciliation wallet freelancer pour deal #${row.id}:`, error.message);
    }
  }
}

async function getClientLockedEscrowAmount(userId) {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(locked_amount), 0) AS total_locked
     FROM (
       SELECT
         d.id,
         GREATEST(
           COALESCE((
             SELECT SUM(p.amount)
             FROM payments p
             WHERE p.deal_id = d.id
               AND p.client_id = ?
               AND p.status = 'Paye'
           ), 0) - COALESCE((
             SELECT SUM(wt.amount)
             FROM wallet_transactions wt
             INNER JOIN wallet_accounts wa ON wa.id = wt.wallet_id
             WHERE wt.deal_id = d.id
               AND wt.type = 'submission_release'
               AND wa.owner_id = 999
           ), 0),
           0
         ) AS locked_amount
       FROM deals d
       WHERE d.client_id = ?
     ) escrow_totals`,
    [userId, userId],
  );

  return Number(rows[0]?.total_locked || 0);
}

export async function getWalletWithTransactions(userId) {
  const wallet = await walletRepo.findWalletByOwnerId(userId);
  if (!wallet) throw new Error("Wallet introuvable.");

  const transactions = await walletRepo.findTransactionsByWalletId(wallet.id);
  const locked = await getClientLockedEscrowAmount(userId);

  return {
    wallet: {
      ...wallet,
      locked,
    },
    transactions: transactions.map(mapWalletTransaction),
  };
}
// Permet de s'assurer que le portefeuille d'un utilisateur existe dans la base de données, en vérifiant si un portefeuille existe pour l'ownerId fourni, et en créant un nouveau portefeuille avec un solde initial de 0 si aucun portefeuille n'existe
export async function topupWallet({ userId, amount }) {
  if (!amount || Number(amount) <= 0) {
    throw new Error("Montant de recharge invalide.");
  }

  const wallet = await walletRepo.findWalletByOwnerId(userId);
  if (!wallet) throw new Error("Wallet introuvable.");

  await stripeDummy({ amount, metadata: { userId, purpose: "topup" } });
// Simuler un délai de traitement de paiement
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
// Permet de retirer des fonds du portefeuille de l'utilisateur connecté en utilisant la logique métier définie dans le service, en fournissant le montant à retirer et les informations de compte bancaire, et en retournant les informations de la transaction de retrait avec un message de succès
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
// Permet de récupérer les informations du portefeuille de l'utilisateur connecté, y compris le solde actuel et la liste des transactions associées, en utilisant la logique métier définie dans le service et en retournant les données formatées avec un message de succès
async function findClientDealById({ dealId, clientId }) {
  const [rows] = await db.query(
    `SELECT id, client_id, freelancer_id, final_price, advance_amount, status, deadline, penalty_cycles
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
  const finalPaidByStatus = ["Totalité payé", "Totalité payée"].includes(String(deal.status || ""));

  const advanceAmount = Number(deal.advance_amount);
  const finalAmount = Math.max(0, Number(deal.final_price) - advanceAmount);
// Retourner un résumé clair du paiement du deal, incluant les montants payés, les montants restants, le statut des paiements, et les détails du deal pour une meilleure compréhension du client
  return {
    deal: {
      id: deal.id,
      status: deal.status,
      finalPrice: Number(deal.final_price),
      advanceAmount,
      finalAmount,
      penaltyCycles: Number(deal.penalty_cycles ?? 0),
    },
    progress: {
      advancePaid: Boolean(advancePayment),
      finalPaid: Boolean(finalPayment) || finalPaidByStatus,
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
// Permet de payer le montant final d'un deal spécifique, en vérifiant que l'utilisateur connecté est bien le client du deal, et en utilisant la logique métier définie dans le service pour effectuer le paiement final, puis en retournant les informations de la transaction de paiement avec un message de succès ou d'erreur selon le cas
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
// Permet de payer le montant total d'un deal spécifique, en vérifiant que l'utilisateur connecté est bien le client du deal, et en utilisant la logique métier définie dans le service pour effectuer le paiement total, puis en retournant les informations de la transaction de paiement avec un message de succès ou d'erreur selon le cas
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
