import db from "../../config/db.js";
import { dealRepository } from "../deals/deal.repository.js";
import * as paymentRepo from "./payment.repository.js";
import {
  createTransaction,
  creditWallet,
  debitWallet,
  ensureSystemWalletOwner,
  findSystemWallet,
  findWalletByOwnerId,
} from "../wallet/wallet.repository.js";

export async function stripeDummy({ amount, metadata = {} }) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (Math.random() < 0.05) {
    throw new Error("STRIPE_ERROR: Paiement refuse par la banque emettrice.");
  }
  return {
    id: `pi_dummy_${Date.now()}`,
    amount,
    status: "succeeded",
    metadata,
    created: new Date().toISOString(),
  };
}

async function resolveFreelancerId(dealId, freelancerIdFromRequest, connection = db) {
  if (freelancerIdFromRequest) {
    const wallet = await findWalletByOwnerId(freelancerIdFromRequest, connection);
    if (wallet) return freelancerIdFromRequest;
  }

  const [rows] = await connection.query(
    "SELECT freelancer_id FROM deals WHERE id = ?",
    [dealId],
  );
  if (!rows[0]) throw new Error("Deal introuvable.");
  const realFreelancerId = rows[0].freelancer_id;

  const wallet = await findWalletByOwnerId(realFreelancerId, connection);
  if (!wallet) throw new Error(`Wallet freelancer introuvable pour le deal #${dealId}.`);

  return realFreelancerId;
}

function formatDealDate(value) {
  if (!value) {
    return "date limite indisponible";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "date limite indisponible";
  }

  return parsed.toLocaleDateString("fr-FR");
}

async function runPaymentTransaction(callback) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateDealAfterPayment(connection, { dealId, note, status }) {
  await connection.query(
    `UPDATE deals
     SET payment_note = ?, status = ?
     WHERE id = ?`,
    [note || null, status, dealId],
  );
}

async function guardDuplicatePayment(connection, dealId, paymentType, errorMessage) {
  const existing = await paymentRepo.findPaymentByDealAndType(dealId, paymentType, connection);
  if (existing?.status === "Paye") {
    throw new Error(errorMessage);
  }
}

export async function getPaymentsByDeal(dealId) {
  return paymentRepo.findPaymentsByDealId(dealId);
}

export async function payAdvance({ dealId, clientId, freelancerId, amount }) {
  return runPaymentTransaction(async (connection) => {
    await guardDuplicatePayment(connection, dealId, "Avance", "L'avance a deja ete payee pour ce deal.");

    await ensureSystemWalletOwner(connection);
    const systemWallet = await findSystemWallet(connection);
    const realFreelancerId = await resolveFreelancerId(dealId, freelancerId, connection);
    const clientWallet = await findWalletByOwnerId(clientId, connection);
    const clientBalanceBefore = Number(clientWallet.balance);

    if (clientBalanceBefore < Number(amount)) {
      throw new Error("Solde insuffisant dans le wallet pour payer l'avance.");
    }

    const payment = await paymentRepo.createPayment({
      dealId,
      clientId,
      freelancerId: realFreelancerId,
      amount,
      paymentType: "Avance",
    }, connection);

    await stripeDummy({ amount, metadata: { dealId, type: "Avance", clientId } });

    await debitWallet(clientId, amount, connection);
    const clientBalanceAfter = clientBalanceBefore - Number(amount);
    await createTransaction({
      walletId: clientWallet.id,
      dealId,
      type: "advance_debit",
      amount,
      balanceBefore: clientBalanceBefore,
      balanceAfter: clientBalanceAfter,
    }, connection);

    await createTransaction({
      walletId: systemWallet.id,
      dealId,
      type: "advance_credit",
      amount,
      balanceBefore: Number(systemWallet.balance),
      balanceAfter: Number(systemWallet.balance) + Number(amount),
    }, connection);
    await creditWallet(systemWallet.owner_id, amount, connection);

    await paymentRepo.updatePaymentStatus(payment.id, "Paye", connection);

    const deal = await dealRepository.findById(dealId, connection);
    const remainingAmount = Math.max(Number(deal.finalPrice) - Number(amount), 0);
    const note = `Avance payee. Reste a payer : ${remainingAmount.toFixed(2)} DT avant le ${formatDealDate(deal.deadline)}.`;
    await updateDealAfterPayment(connection, {
      dealId,
      note,
      status: "En cours",
    });

    return {
      payment: { ...payment, status: "Paye" },
      deal: await dealRepository.findById(dealId, connection),
    };
  });
}

export async function payFinal({ dealId, clientId, freelancerId, amount }) {
  return runPaymentTransaction(async (connection) => {
    await guardDuplicatePayment(connection, dealId, "Paiement final", "Le paiement final a deja ete effectue pour ce deal.");

    await ensureSystemWalletOwner(connection);
    const systemWallet = await findSystemWallet(connection);
    const realFreelancerId = await resolveFreelancerId(dealId, freelancerId, connection);
    const clientWallet = await findWalletByOwnerId(clientId, connection);
    const clientBalanceBefore = Number(clientWallet.balance);
    const deal = await dealRepository.findById(dealId, connection);
    const escrowAmount = Number(deal?.advanceAmount ?? 0);

    if (clientBalanceBefore < Number(amount)) {
      throw new Error("Solde insuffisant dans le wallet pour payer le montant final.");
    }

    if (Number(systemWallet.balance) < escrowAmount) {
      throw new Error("Le wallet technique 999 ne contient pas l'avance attendue pour ce deal.");
    }

    const payment = await paymentRepo.createPayment({
      dealId,
      clientId,
      freelancerId: realFreelancerId,
      amount,
      paymentType: "Paiement final",
    }, connection);

    await stripeDummy({ amount, metadata: { dealId, type: "Paiement final", clientId } });

    await debitWallet(clientId, amount, connection);
    const clientBalanceAfter = clientBalanceBefore - Number(amount);
    await createTransaction({
      walletId: clientWallet.id,
      dealId,
      type: "final_debit",
      amount,
      balanceBefore: clientBalanceBefore,
      balanceAfter: clientBalanceAfter,
    }, connection);

    const freelancerWallet = await findWalletByOwnerId(realFreelancerId, connection);
    const freelancerBalanceBefore = Number(freelancerWallet.balance);

    await debitWallet(systemWallet.owner_id, escrowAmount, connection);
    await creditWallet(realFreelancerId, escrowAmount, connection);
    await creditWallet(realFreelancerId, amount, connection);
    const freelancerBalanceAfter = freelancerBalanceBefore + escrowAmount + Number(amount);

    await createTransaction({
      walletId: freelancerWallet.id,
      dealId,
      type: "advance_credit",
      amount: escrowAmount,
      balanceBefore: freelancerBalanceBefore,
      balanceAfter: freelancerBalanceBefore + escrowAmount,
    }, connection);

    await createTransaction({
      walletId: freelancerWallet.id,
      dealId,
      type: "final_credit",
      amount,
      balanceBefore: freelancerBalanceBefore + escrowAmount,
      balanceAfter: freelancerBalanceAfter,
    }, connection);

    await paymentRepo.updatePaymentStatus(payment.id, "Paye", connection);
    await updateDealAfterPayment(connection, {
      dealId,
      note: "Montant total paye.",
      status: "Totalité payé",
    });

    return {
      payment: { ...payment, status: "Paye" },
      deal: await dealRepository.findById(dealId, connection),
    };
  });
}

export async function payTotal({ dealId, clientId, freelancerId, totalAmount, advanceAmount, deadline }) {
  return runPaymentTransaction(async (connection) => {
    await guardDuplicatePayment(connection, dealId, "Avance", "Une avance a deja ete payee pour ce deal.");
    await guardDuplicatePayment(connection, dealId, "Paiement final", "Le montant total a deja ete paye pour ce deal.");

    const realFreelancerId = await resolveFreelancerId(dealId, freelancerId, connection);
    const remainingAmount = Math.max(Number(totalAmount) - Number(advanceAmount), 0);
    const clientWallet = await findWalletByOwnerId(clientId, connection);
    const clientBalanceBefore = Number(clientWallet.balance);

    if (clientBalanceBefore < Number(totalAmount)) {
      throw new Error("Solde insuffisant dans le wallet pour payer le montant total.");
    }

    const advancePayment = await paymentRepo.createPayment({
      dealId,
      clientId,
      freelancerId: realFreelancerId,
      amount: Number(advanceAmount),
      paymentType: "Avance",
    }, connection);

    const finalPayment = await paymentRepo.createPayment({
      dealId,
      clientId,
      freelancerId: realFreelancerId,
      amount: remainingAmount,
      paymentType: "Paiement final",
    }, connection);

    await stripeDummy({ amount: totalAmount, metadata: { dealId, type: "Paiement total", clientId } });

    await debitWallet(clientId, Number(advanceAmount), connection);
    await debitWallet(clientId, remainingAmount, connection);
    const clientBalanceAfter = clientBalanceBefore - Number(totalAmount);

    await createTransaction({
      walletId: clientWallet.id,
      dealId,
      type: "advance_debit",
      amount: Number(advanceAmount),
      balanceBefore: clientBalanceBefore,
      balanceAfter: clientBalanceBefore - Number(advanceAmount),
    }, connection);

    await createTransaction({
      walletId: clientWallet.id,
      dealId,
      type: "final_debit",
      amount: remainingAmount,
      balanceBefore: clientBalanceBefore - Number(advanceAmount),
      balanceAfter: clientBalanceAfter,
    }, connection);

    const freelancerWallet = await findWalletByOwnerId(realFreelancerId, connection);
    const freelancerBalanceBefore = Number(freelancerWallet.balance);
    await creditWallet(realFreelancerId, Number(advanceAmount), connection);
    await creditWallet(realFreelancerId, remainingAmount, connection);
    const freelancerBalanceAfter = freelancerBalanceBefore + Number(totalAmount);

    await createTransaction({
      walletId: freelancerWallet.id,
      dealId,
      type: "advance_credit",
      amount: Number(advanceAmount),
      balanceBefore: freelancerBalanceBefore,
      balanceAfter: freelancerBalanceBefore + Number(advanceAmount),
    }, connection);

    await createTransaction({
      walletId: freelancerWallet.id,
      dealId,
      type: "final_credit",
      amount: remainingAmount,
      balanceBefore: freelancerBalanceBefore + Number(advanceAmount),
      balanceAfter: freelancerBalanceAfter,
    }, connection);

    await paymentRepo.updatePaymentStatus(advancePayment.id, "Paye", connection);
    await paymentRepo.updatePaymentStatus(finalPayment.id, "Paye", connection);

    await updateDealAfterPayment(connection, {
      dealId,
      note: `Montant total paye avant le ${formatDealDate(deadline)}.`,
      status: "Totalité payé",
    });

    return {
      payments: [
        { ...advancePayment, status: "Paye" },
        { ...finalPayment, status: "Paye" },
      ],
      deal: await dealRepository.findById(dealId, connection),
    };
  });
}

export async function refundPayment({ paymentId, clientId }) {
  const payment = await paymentRepo.findPaymentById(paymentId);
  if (!payment) throw new Error("Paiement introuvable.");
  if (payment.status !== "Paye") {
    throw new Error("Seuls les paiements payes peuvent etre rembourses.");
  }

  const clientWallet = await findWalletByOwnerId(clientId);
  const balanceBefore = Number(clientWallet.balance);
  await creditWallet(clientId, payment.amount);
  const balanceAfter = balanceBefore + Number(payment.amount);

  await createTransaction({
    walletId: clientWallet.id,
    dealId: payment.deal_id,
    type: "refund",
    amount: payment.amount,
    balanceBefore,
    balanceAfter,
  });

  await paymentRepo.updatePaymentStatus(paymentId, "Rembourse");

  return { refunded: true, amount: payment.amount };
}
