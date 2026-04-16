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

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PENALTY_RATE = 0.1;
const PENALTY_CYCLE_DAYS = 3;

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

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

function computeDelayPenalty(deal) {
  if (!deal?.deadline) {
    return {
      daysLate: 0,
      cycles: 0,
      penaltyAmount: 0,
      hasPenalty: false,
    };
  }

  const deadlineDate = new Date(`${deal.deadline}T23:59:59`);
  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      daysLate: 0,
      cycles: 0,
      penaltyAmount: 0,
      hasPenalty: false,
    };
  }

  const referenceDate = deal.submittedAt ? new Date(deal.submittedAt) : new Date();
  if (Number.isNaN(referenceDate.getTime())) {
    return {
      daysLate: 0,
      cycles: 0,
      penaltyAmount: 0,
      hasPenalty: false,
    };
  }

  const daysLate = Math.max(0, Math.floor((referenceDate.getTime() - deadlineDate.getTime()) / DAY_IN_MS));
  const cycles = Math.floor(daysLate / PENALTY_CYCLE_DAYS);
  const penaltyAmount = roundMoney(Number(deal.finalPrice ?? 0) * PENALTY_RATE * cycles);

  return {
    daysLate,
    cycles,
    penaltyAmount,
    hasPenalty: penaltyAmount > 0,
  };
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

async function updateDealAfterPayment(connection, { dealId, note, status, penaltyCycles = 0 }) {
  await connection.query(
    `UPDATE deals
     SET payment_note = ?,
         status = ?,
         penalty_cycles = ?
     WHERE id = ?`,
    [note || null, status, Number.isFinite(penaltyCycles) ? penaltyCycles : 0, dealId],
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
      penaltyCycles: 0,
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
    const finalAmountDue = roundMoney(Number(amount));

    if (deal?.status === "Totalité payé") {
      throw new Error("Le paiement final a deja ete effectue pour ce deal.");
    }

    if (!Number.isFinite(finalAmountDue) || finalAmountDue < 0) {
      throw new Error("Montant final invalide.");
    }

    const penalty = computeDelayPenalty(deal);
    const grossDue = roundMoney(escrowAmount + finalAmountDue);
    const penaltyAmount = Math.min(roundMoney(penalty.penaltyAmount), grossDue);
    const penaltyFromFinal = Math.min(penaltyAmount, finalAmountDue);
    const penaltyFromEscrow = roundMoney(penaltyAmount - penaltyFromFinal);
    const adjustedFinalAmount = roundMoney(Math.max(finalAmountDue - penaltyFromFinal, 0));
    const escrowReleaseAmount = roundMoney(Math.max(escrowAmount - penaltyFromEscrow, 0));

    if (clientBalanceBefore < adjustedFinalAmount) {
      throw new Error("Solde insuffisant dans le wallet pour payer le montant final.");
    }

    if (Number(systemWallet.balance) < escrowAmount) {
      throw new Error("Le wallet technique 999 ne contient pas l'avance attendue pour ce deal.");
    }

    let payment = null;
    if (adjustedFinalAmount > 0) {
      payment = await paymentRepo.createPayment({
        dealId,
        clientId,
        freelancerId: realFreelancerId,
        amount: adjustedFinalAmount,
        paymentType: "Paiement final",
      }, connection);

      await stripeDummy({
        amount: adjustedFinalAmount,
        metadata: { dealId, type: "Paiement final", clientId, penaltyCycles: penalty.cycles },
      });
    }

    let clientBalanceAfter = clientBalanceBefore;
    if (adjustedFinalAmount > 0) {
      await debitWallet(clientId, adjustedFinalAmount, connection);
      clientBalanceAfter = roundMoney(clientBalanceAfter - adjustedFinalAmount);
      await createTransaction({
        walletId: clientWallet.id,
        dealId,
        type: "final_debit",
        amount: adjustedFinalAmount,
        balanceBefore: clientBalanceBefore,
        balanceAfter: clientBalanceAfter,
      }, connection);
    }

    if (penaltyFromEscrow > 0) {
      await creditWallet(clientId, penaltyFromEscrow, connection);
      const clientBalanceBeforePenaltyCredit = clientBalanceAfter;
      clientBalanceAfter = roundMoney(clientBalanceAfter + penaltyFromEscrow);
      await createTransaction({
        walletId: clientWallet.id,
        dealId,
        type: "penalty",
        amount: penaltyFromEscrow,
        balanceBefore: clientBalanceBeforePenaltyCredit,
        balanceAfter: clientBalanceAfter,
      }, connection);
    }

    const freelancerWallet = await findWalletByOwnerId(realFreelancerId, connection);
    const freelancerBalanceBefore = Number(freelancerWallet.balance);

    await debitWallet(systemWallet.owner_id, escrowAmount, connection);
    if (escrowReleaseAmount > 0) {
      await creditWallet(realFreelancerId, escrowReleaseAmount, connection);
    }
    if (adjustedFinalAmount > 0) {
      await creditWallet(realFreelancerId, adjustedFinalAmount, connection);
    }

    let freelancerBalanceCursor = freelancerBalanceBefore;
    if (escrowReleaseAmount > 0) {
      const nextBalance = roundMoney(freelancerBalanceCursor + escrowReleaseAmount);
      await createTransaction({
        walletId: freelancerWallet.id,
        dealId,
        type: "advance_credit",
        amount: escrowReleaseAmount,
        balanceBefore: freelancerBalanceCursor,
        balanceAfter: nextBalance,
      }, connection);
      freelancerBalanceCursor = nextBalance;
    }

    if (adjustedFinalAmount > 0) {
      const nextBalance = roundMoney(freelancerBalanceCursor + adjustedFinalAmount);
      await createTransaction({
        walletId: freelancerWallet.id,
        dealId,
        type: "final_credit",
        amount: adjustedFinalAmount,
        balanceBefore: freelancerBalanceCursor,
        balanceAfter: nextBalance,
      }, connection);
      freelancerBalanceCursor = nextBalance;
    }

    if (payment) {
      await paymentRepo.updatePaymentStatus(payment.id, "Paye", connection);
    }

    const note = penalty.hasPenalty
      ? `Paiement final traite avec penalite de retard: ${penaltyAmount.toFixed(2)} DT (${penalty.cycles} cycle(s), ${penalty.daysLate} jour(s) de retard). Montant final debite: ${adjustedFinalAmount.toFixed(2)} DT.`
      : "Montant total paye.";

    await updateDealAfterPayment(connection, {
      dealId,
      note,
      status: "Totalité payé",
      penaltyCycles: penalty.cycles,
    });

    return {
      payment: payment ? { ...payment, status: "Paye" } : null,
      penalty: {
        daysLate: penalty.daysLate,
        cycles: penalty.cycles,
        amount: penaltyAmount,
        amountFromFinal: penaltyFromFinal,
        amountFromEscrow: penaltyFromEscrow,
      },
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
      penaltyCycles: 0,
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
