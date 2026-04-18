import db from "../../config/db.js";
import { env } from "../../config/env.js";
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
const NON_PAYMENT_GRACE_HOURS = Math.max(1, env.NON_PAYMENT_RULE_GRACE_HOURS);
const NON_PAYMENT_WATCH_INTERVAL_MS = Math.max(60000, env.NON_PAYMENT_RULE_INTERVAL_MS);
const NON_PAYMENT_ACTIVE_DEAL_STATUSES = [
  "En cours",
  "Actif",
  "Soumis",
  "En attente paiement final",
  "Terminé",
];

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

let nonPaymentRuleTimer = null;
let nonPaymentRuleRunning = false;

export async function stripeDummy({ amount, metadata = {} }) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    id: `pi_dummy_${Date.now()}`,
    amount,
    status: "succeeded",
    metadata,
    created: new Date().toISOString(),
  };
}

async function resolveFreelancerId(dealId, freelancerIdFromRequest, connection = db) {
  if (!Number.isInteger(Number(dealId)) || dealId <= 0) {
    throw new Error("Invalid deal ID");
  }
  
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

  if (!Number.isInteger(Number(realFreelancerId)) || realFreelancerId <= 0) {
    throw new Error("Invalid freelancer ID in deal");
  }

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

function isFinalPaymentGraceExpired(submittedAt, now = new Date()) {
  if (!submittedAt) {
    return false;
  }

  const submittedDate = new Date(submittedAt);
  if (Number.isNaN(submittedDate.getTime()) || Number.isNaN(now.getTime())) {
    return false;
  }

  return now.getTime() - submittedDate.getTime() >= NON_PAYMENT_GRACE_HOURS * 60 * 60 * 1000;
}

async function isPaymentTypePaid(connection, dealId, paymentType) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM payments
     WHERE deal_id = ?
       AND payment_type = ?
       AND status = 'Paye'
     LIMIT 1`,
    [dealId, paymentType],
  );

  return rows.length > 0;
}

async function hasSubmissionRelease(connection, dealId) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM wallet_transactions
     WHERE deal_id = ?
       AND type = 'submission_release'
     LIMIT 1`,
    [dealId],
  );

  return rows.length > 0;
}

async function applyAutoCancellationForNonPayment(connection, deal) {
  const dealId = Number(deal?.id);
  const dealStatus = String(deal?.status || "");
  const submittedAt = deal?.submittedAt ?? deal?.submitted_at ?? null;
  if (!dealId) {
    return { applied: false, reason: "invalid_deal" };
  }

  if (dealStatus === "Annule" || dealStatus === "Totalité payé") {
    return { applied: false, reason: "terminal_status" };
  }

  if (!isFinalPaymentGraceExpired(submittedAt)) {
    return { applied: false, reason: "grace_not_expired" };
  }

  const finalPaid = await isPaymentTypePaid(connection, dealId, "Paiement final");
  if (finalPaid) {
    return { applied: false, reason: "final_paid" };
  }

  const note = `Contrat annule automatiquement: solde non paye sous ${NON_PAYMENT_GRACE_HOURS}h apres livraison. Aucun paiement supplementaire n'a ete traite. Le freelance conserve uniquement ce qui avait deja ete libere.`;

  await connection.query(
    `UPDATE deals
     SET status = 'Annule',
         payment_note = ?
     WHERE id = ?`,
    [note, dealId],
  );

  return {
    applied: true,
    dealId,
    releasedAdvanceAmount: 0,
  };
}

async function findOverdueUnpaidDealIds() {
  const placeholders = NON_PAYMENT_ACTIVE_DEAL_STATUSES.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT d.id
     FROM deals d
     WHERE d.submitted_at IS NOT NULL
       AND d.status IN (${placeholders})
       AND TIMESTAMPDIFF(HOUR, d.submitted_at, NOW()) >= ?
       AND EXISTS (
         SELECT 1
         FROM payments p
         WHERE p.deal_id = d.id
           AND p.payment_type = 'Avance'
           AND p.status = 'Paye'
       )
       AND NOT EXISTS (
         SELECT 1
         FROM payments p
         WHERE p.deal_id = d.id
           AND p.payment_type = 'Paiement final'
           AND p.status = 'Paye'
       )`,
    [...NON_PAYMENT_ACTIVE_DEAL_STATUSES, NON_PAYMENT_GRACE_HOURS],
  );

  return rows
    .map((row) => Number(row.id))
    .filter((dealId) => Number.isInteger(dealId) && dealId > 0);
}

export async function enforceNonPaymentFinalRule() {
  if (!env.NON_PAYMENT_RULE_ENABLED) {
    return { enabled: false, candidates: 0, processed: 0, skipped: 0, failed: 0 };
  }

  if (nonPaymentRuleRunning) {
    return { enabled: true, candidates: 0, processed: 0, skipped: 0, failed: 0, running: true };
  }

  nonPaymentRuleRunning = true;

  try {
    const candidateDealIds = await findOverdueUnpaidDealIds();
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const dealId of candidateDealIds) {
      try {
        const outcome = await runPaymentTransaction(async (connection) => {
          const [rows] = await connection.query(
            `SELECT id, freelancer_id, advance_amount, submitted_at, status
             FROM deals
             WHERE id = ?
             FOR UPDATE`,
            [dealId],
          );

          if (!rows[0]) {
            return { applied: false, reason: "deal_not_found" };
          }

          return applyAutoCancellationForNonPayment(connection, rows[0]);
        });

        if (outcome?.applied) {
          processed += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;
        console.error(`[non-payment-rule] deal #${dealId} failed:`, error.message);
      }
    }

    return {
      enabled: true,
      candidates: candidateDealIds.length,
      processed,
      skipped,
      failed,
    };
  } finally {
    nonPaymentRuleRunning = false;
  }
}

export function startNonPaymentFinalRuleWatcher() {
  if (!env.NON_PAYMENT_RULE_ENABLED) {
    return null;
  }

  if (nonPaymentRuleTimer) {
    return nonPaymentRuleTimer;
  }

  const runTick = async () => {
    try {
      const summary = await enforceNonPaymentFinalRule();
      if (summary.processed > 0 || summary.failed > 0) {
        console.log(
          `[non-payment-rule] candidates=${summary.candidates} processed=${summary.processed} failed=${summary.failed}`,
        );
      }
    } catch (error) {
      console.error("[non-payment-rule] unexpected watcher error:", error.message);
    }
  };

  void runTick();
  nonPaymentRuleTimer = setInterval(() => {
    void runTick();
  }, NON_PAYMENT_WATCH_INTERVAL_MS);

  return nonPaymentRuleTimer;
}

export function stopNonPaymentFinalRuleWatcher() {
  if (!nonPaymentRuleTimer) {
    return;
  }

  clearInterval(nonPaymentRuleTimer);
  nonPaymentRuleTimer = null;
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
    const realFreelancerId = await resolveFreelancerId(dealId, freelancerId, connection);
    const clientWallet = await findWalletByOwnerId(clientId, connection);
    const clientBalanceBefore = Number(clientWallet.balance);
    const deal = await dealRepository.findById(dealId, connection);
    const escrowAmount = Number(deal?.advanceAmount ?? 0);
    const requestedFinalAmount = roundMoney(Number(amount));
    const submissionReleased = await hasSubmissionRelease(connection, dealId);

    if (deal?.status === "Annule") {
      throw new Error("Le deal est annule.");
    }

    if (!deal?.submittedAt) {
      throw new Error("Le paiement final n'est autorise qu'apres la soumission du travail.");
    }

    if (isFinalPaymentGraceExpired(deal?.submittedAt)) {
      const cancellation = await applyAutoCancellationForNonPayment(connection, deal);
      if (cancellation.applied) {
        throw new Error(
          `Le delai de paiement final (${NON_PAYMENT_GRACE_HOURS}h) est depasse. Le contrat a ete annule et l'acompte reverse au freelance.`,
        );
      }

      throw new Error(
        `Le delai de paiement final (${NON_PAYMENT_GRACE_HOURS}h) est depasse.`,
      );
    }

    if (deal?.status === "Totalité payé") {
      throw new Error("Le paiement final a deja ete effectue pour ce deal.");
    }

    if (!Number.isFinite(requestedFinalAmount) || requestedFinalAmount < 0) {
      throw new Error("Montant final invalide.");
    }

    const penalty = computeDelayPenalty(deal);
    const penaltyAmount = roundMoney(Math.max(Number(penalty.penaltyAmount || 0), 0));
    const penaltyAppliedOnAdvance = submissionReleased
      ? Math.min(penaltyAmount, escrowAmount)
      : 0;
    const remainingPenaltyForFinal = roundMoney(Math.max(penaltyAmount - penaltyAppliedOnAdvance, 0));
    const adjustedFinalAmount = roundMoney(Math.max(requestedFinalAmount - remainingPenaltyForFinal, 0));

    if (clientBalanceBefore < adjustedFinalAmount) {
      throw new Error("Solde insuffisant dans le wallet pour payer le montant final.");
    }
    const payment = await paymentRepo.createPayment({
      dealId,
      clientId,
      freelancerId: realFreelancerId,
      amount: adjustedFinalAmount,
      paymentType: "Paiement final",
    }, connection);

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

    if (remainingPenaltyForFinal > 0) {
      await creditWallet(clientId, remainingPenaltyForFinal, connection);
      const clientBalanceBeforePenaltyCredit = clientBalanceAfter;
      clientBalanceAfter = roundMoney(clientBalanceAfter + remainingPenaltyForFinal);
      await createTransaction({
        walletId: clientWallet.id,
        dealId,
        type: "penalty_credit",
        amount: remainingPenaltyForFinal,
        balanceBefore: clientBalanceBeforePenaltyCredit,
        balanceAfter: clientBalanceAfter,
        note: `Penalite de retard appliquee sur le solde final: ${remainingPenaltyForFinal.toFixed(2)} DT.`,
      }, connection);
    }

    const freelancerWallet = await findWalletByOwnerId(realFreelancerId, connection);
    const freelancerBalanceBefore = Number(freelancerWallet.balance);
    if (adjustedFinalAmount > 0) {
      await creditWallet(realFreelancerId, adjustedFinalAmount, connection);
    }

    let freelancerBalanceCursor = freelancerBalanceBefore;
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
      ? `Paiement final traite avec penalite de retard: ${penaltyAmount.toFixed(2)} DT (${penalty.cycles} cycle(s), ${penalty.daysLate} jour(s) de retard). Solde final verse: ${adjustedFinalAmount.toFixed(2)} DT.`
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
        amountFromFinal: remainingPenaltyForFinal,
        amountFromEscrow: penaltyAppliedOnAdvance,
      },
      deal: await dealRepository.findById(dealId, connection),
    };
  });
}

export async function payTotal({ dealId, clientId, freelancerId, totalAmount, advanceAmount, deadline }) {
  throw new Error("Le paiement total anticipe n'est pas autorise. Le client doit payer 30% d'avance puis 70% apres livraison.");
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

export async function releaseFreelancerPaymentOnSubmission({ dealId }) {
  return runPaymentTransaction(async (connection) => {
    const deal = await dealRepository.findById(dealId, connection);
    if (!deal) {
      throw new Error("Deal introuvable.");
    }

    const dealStatus = String(deal?.status || "");
    if (dealStatus === "Annule") {
      throw new Error("Le deal est annule.");
    }

    // Check if already released
    const [existingRelease] = await connection.query(
      `SELECT 1 FROM wallet_transactions 
       WHERE deal_id = ? AND type = 'submission_release' 
       LIMIT 1`,
      [dealId],
    );
    
    if (existingRelease.length > 0) {
      return { released: false, reason: "already_released" };
    }

    const freelancerId = Number(deal.freelancerId || deal.freelancer_id);
    const advanceAmount = roundMoney(Number(deal.advanceAmount || deal.advance_amount || 0));
    const finalPrice = roundMoney(Number(deal.finalPrice || deal.final_price || 0));

    // Check if advance was paid
    const advancePaid = await isPaymentTypePaid(connection, dealId, "Avance");
    if (!advancePaid || advanceAmount === 0) {
      return { released: false, reason: "advance_not_paid" };
    }

    await ensureSystemWalletOwner(connection);
    const systemWallet = await findSystemWallet(connection);
    const freelancerWallet = await findWalletByOwnerId(freelancerId, connection);

    if (Number(systemWallet.balance) < advanceAmount) {
      throw new Error(`Wallet systeme insuffisant pour la liberation du paiement freelance du deal #${dealId}.`);
    }

    // Calculate penalties
    const penalty = computeDelayPenalty(deal);
    const penaltyAmount = penalty.penaltyAmount;

    // Debit system wallet and credit freelancer
    const freelancerBalanceBefore = Number(freelancerWallet.balance);
    
    // Release advance to freelancer
    await debitWallet(systemWallet.owner_id, advanceAmount, connection);
    await creditWallet(freelancerId, advanceAmount, connection);

    await createTransaction({
      walletId: freelancerWallet.id,
      dealId,
      type: "submission_release",
      amount: advanceAmount,
      balanceBefore: freelancerBalanceBefore,
      balanceAfter: roundMoney(freelancerBalanceBefore + advanceAmount),
      note: `Paiement libere a la soumission de travail. Penalite potentielle: ${penaltyAmount.toFixed(2)} DT (${penalty.daysLate} jour(s) de retard).`,
    }, connection);

    // Handle penalties if any
    let penaltyReturnAmount = 0;
    if (penaltyAmount > 0) {
      const clientId = Number(deal.clientId || deal.client_id);
      const clientWallet = await findWalletByOwnerId(clientId, connection);
      const clientBalanceBefore = Number(clientWallet.balance);
      
      penaltyReturnAmount = Math.min(penaltyAmount, advanceAmount);
      
      if (penaltyReturnAmount > 0) {
        // Debit penalty from freelancer's advance that was just released
        await debitWallet(freelancerId, penaltyReturnAmount, connection);
        await creditWallet(clientId, penaltyReturnAmount, connection);

        const freelancerBalanceAfterPenalty = roundMoney(freelancerBalanceBefore + advanceAmount - penaltyReturnAmount);
        await createTransaction({
          walletId: freelancerWallet.id,
          dealId,
          type: "penalty_debit",
          amount: penaltyReturnAmount,
          balanceBefore: roundMoney(freelancerBalanceBefore + advanceAmount),
          balanceAfter: freelancerBalanceAfterPenalty,
          note: `Penalite de retard deduite: ${penaltyReturnAmount.toFixed(2)} DT (${penalty.cycles} cycle(s)).`,
        }, connection);

        const clientBalanceAfterPenalty = roundMoney(clientBalanceBefore + penaltyReturnAmount);
        await createTransaction({
          walletId: clientWallet.id,
          dealId,
          type: "penalty_credit",
          amount: penaltyReturnAmount,
          balanceBefore: clientBalanceBefore,
          balanceAfter: clientBalanceAfterPenalty,
          note: `Penalite de retard returned pour freelancer en retard: ${penaltyReturnAmount.toFixed(2)} DT.`,
        }, connection);
      }
    }

    const note = penalty.hasPenalty
      ? `Travail soumis avec penalite potentielle de ${penaltyAmount.toFixed(2)} DT (${penalty.cycles} cycle(s), ${penalty.daysLate} jour(s) de retard). Paiement freelance libere.`
      : `Travail soumis. Paiement freelance libere.`;

    await connection.query(
      `UPDATE deals 
       SET payment_note = ?
       WHERE id = ?`,
      [note, dealId],
    );

    return {
      released: true,
      dealId,
      freelancerId,
      releasedAmount: advanceAmount,
      penaltyDeducted: penaltyReturnAmount,
      finalNetAmount: roundMoney(advanceAmount - penaltyReturnAmount),
    };
  });
}
