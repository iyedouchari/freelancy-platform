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
} from "../wallet/wallet.repository.js";// On importe les fonctions de gestion des transactions et des wallets pour pouvoir manipuler les fonds lors des paiements

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

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;// Fonction utilitaire pour arrondir les montants à 2 décimales, afin d'éviter les problèmes de précision avec les nombres à virgule flottante en JavaScript

let nonPaymentRuleTimer = null;
let nonPaymentRuleRunning = false;

function isDealDeadlineReached(deadline, now = new Date()) {// Permet de vérifier si la date limite d'un deal est atteinte en comparant la date limite avec la date actuelle, en prenant en compte les formats de date et en gérant les cas où la date limite n'est pas définie ou invalide
  if (!deadline) {
    return false;
  }

  const deadlineDate = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(deadlineDate.getTime()) || Number.isNaN(now.getTime())) {
    return false;
  }

  return now.getTime() >= deadlineDate.getTime();
}

export async function stripeDummy({ amount, metadata = {} }) {// Fonction simulant un paiement Stripe pour les besoins de développement et de test, en attendant l'intégration réelle avec l'API Stripe. Elle retourne une réponse simulée après un délai pour imiter le comportement d'un paiement réel.
  await new Promise((resolve) => setTimeout(resolve, 30));
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
  // Si un freelancerId est fourni dans la requête, on vérifie qu'il correspond à un wallet existant et on le retourne. Sinon, on récupère le freelancerId associé au deal depuis la base de données pour s'assurer que le paiement est bien lié au deal concerné
  if (freelancerIdFromRequest) {
    const wallet = await findWalletByOwnerId(freelancerIdFromRequest, connection);
    if (wallet) return freelancerIdFromRequest;
  }
// Si le freelancerId n'est pas fourni ou est invalide, on récupère le freelancerId associé au deal depuis la base de données pour s'assurer que le paiement est bien lié au deal concerné
  const [rows] = await connection.query(
    "SELECT freelancer_id FROM deals WHERE id = ?",
    [dealId],
  );
  if (!rows[0]) throw new Error("Deal introuvable.");
  const realFreelancerId = rows[0].freelancer_id;
// On vérifie que le freelancerId récupéré est valide et correspond à un wallet existant, sinon on retourne une erreur pour éviter de créer un paiement avec un freelancerId incorrect
  if (!Number.isInteger(Number(realFreelancerId)) || realFreelancerId <= 0) {
    throw new Error("Invalid freelancer ID in deal");
  }

  const wallet = await findWalletByOwnerId(realFreelancerId, connection);
  if (!wallet) throw new Error(`Wallet freelancer introuvable pour le deal #${dealId}.`);

  return realFreelancerId;
}
// Permet de payer une avance pour un deal spécifique, en vérifiant que les conditions de paiement sont remplies (pas de paiement déjà effectué, solde suffisant dans le wallet du client, etc.), en créant les transactions nécessaires dans les wallets et en mettant à jour le statut du paiement et du deal en conséquence
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
// Permet de calculer la pénalité de
function computeDelayPenalty(deal) {
  if (!deal?.deadline) {
    return {
      daysLate: 0,
      cycles: 0,
      penaltyAmount: 0,
      hasPenalty: false,
    };
  }
// On calcule
  const deadlineDate = new Date(`${deal.deadline}T23:59:59`);
  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      daysLate: 0,
      cycles: 0,
      penaltyAmount: 0,
      hasPenalty: false,
    };
  }
// La date de référence pour le calcul
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

async function getWalletTransactionAmountByType(connection, { walletId, dealId, type }) {
  const [rows] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM wallet_transactions
     WHERE wallet_id = ?
       AND deal_id = ?
       AND type = ?`,
    [walletId, dealId, type],
  );

  return roundMoney(Number(rows[0]?.total || 0));
}
// Permet de trouver les deals candidats pour la règle de libération à échéance de l'avance, en effectuant une requête SQL pour sélectionner les deals qui ont une deadline dépassée, un paiement d'avance payé, et qui n'ont pas encore bénéficié d'une libération liée à la soumission, et en retournant les résultats sous forme de tableau d'IDs de deals
async function findAdvanceDeadlineReleaseCandidateDealIds(connection = db) {
  const [rows] = await connection.query(
    `SELECT d.id
     FROM deals d
     WHERE d.deadline IS NOT NULL
       AND d.status <> 'Annule'
       AND EXISTS (
         SELECT 1
         FROM payments p
         WHERE p.deal_id = d.id
           AND p.payment_type = 'Avance'
           AND p.status = 'Paye'
       )
       AND TIMESTAMPDIFF(SECOND, CONCAT(DATE(d.deadline), ' 23:59:59'), NOW()) >= 0`,
  );

  return rows
    .map((row) => Number(row.id))
    .filter((dealId) => Number.isInteger(dealId) && dealId > 0);
}
// Permet de trouver les deals candidats pour la règle d'annulation pour non-paiement, en effectuant une requête SQL pour sélectionner les deals qui ont été soumis depuis plus de X heures, qui ont un paiement d'avance payé, qui n'ont pas de paiement final payé, et qui sont dans un statut actif, et en retournant les résultats sous forme de tableau d'IDs de deals
async function applyAutoCancellationForNonPayment(connection, deal) {
  const dealId = Number(deal?.id);
  const dealStatus = String(deal?.status || "");
  const submittedAt = deal?.submittedAt ?? deal?.submitted_at ?? null;
  if (!dealId) {
    return { applied: false, reason: "invalid_deal" };
  }

  if (["Annule", "Annulé", "Totalité payée"].includes(dealStatus)) {
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

export async function enforceAdvanceDeadlineReleaseRule() {
  return {
    candidates: 0,
    processed: 0,
    skipped: 0,
    failed: 0,
  };
}

export function startNonPaymentFinalRuleWatcher() {
  if (nonPaymentRuleTimer) {
    return nonPaymentRuleTimer;
  }

  const runTick = async () => {
    try {
      const advanceSummary = await enforceAdvanceDeadlineReleaseRule();
      const summary = await enforceNonPaymentFinalRule();
      if (advanceSummary.processed > 0 || advanceSummary.failed > 0) {
        console.log(
          `[advance-deadline-release] candidates=${advanceSummary.candidates} processed=${advanceSummary.processed} failed=${advanceSummary.failed}`,
        );
      }
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

export async function payAdvance({ dealId, clientId, freelancerId, amount }, externalConnection = null) {
  const execute = async (connection) => {
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
  };

  if (externalConnection) {
    return execute(externalConnection);
  }

  return runPaymentTransaction(execute);
}

export async function payFinal({ dealId, clientId, freelancerId, amount }) {
  return runPaymentTransaction(async (connection) => {
    await guardDuplicatePayment(connection, dealId, "Paiement final", "Le paiement final a deja ete effectue pour ce deal.");
    const advancePaid = await isPaymentTypePaid(connection, dealId, "Avance");
    if (!advancePaid) {
      throw new Error("L'avance doit etre payee avant le paiement final.");
    }

    await ensureSystemWalletOwner(connection);
    const systemWallet = await findSystemWallet(connection);
    const realFreelancerId = await resolveFreelancerId(dealId, freelancerId, connection);
    const clientWallet = await findWalletByOwnerId(clientId, connection);
    const clientBalanceBefore = Number(clientWallet.balance);
    const deal = await dealRepository.findById(dealId, connection);
    const requestedFinalAmount = roundMoney(Number(amount));

    if (["Annule", "Annulé"].includes(String(deal?.status || ""))) {
      throw new Error("Le deal est annule.");
    }

    if (deal?.submittedAt && isFinalPaymentGraceExpired(deal?.submittedAt)) {
      const cancellation = await applyAutoCancellationForNonPayment(connection, deal);
      if (cancellation.applied) {
        throw new Error(
          `Le delai de paiement final (${NON_PAYMENT_GRACE_HOURS}h) est depasse. Le contrat a ete annule automatiquement.`,
        );
      }

      throw new Error(
        `Le delai de paiement final (${NON_PAYMENT_GRACE_HOURS}h) est depasse.`,
      );
    }

    if (deal?.status === "Totalité payée") {
      throw new Error("Le paiement final a deja ete effectue pour ce deal.");
    }

    if (!Number.isFinite(requestedFinalAmount) || requestedFinalAmount < 0) {
      throw new Error("Montant final invalide.");
    }

    const finalAmountToEscrow = roundMoney(Math.max(requestedFinalAmount, 0));

    if (clientBalanceBefore < finalAmountToEscrow) {
      throw new Error("Solde insuffisant dans le wallet pour payer le montant final.");
    }

    let payment = null;
    if (finalAmountToEscrow > 0) {
      payment = await paymentRepo.createPayment(
        {
          dealId,
          clientId,
          freelancerId: realFreelancerId,
          amount: finalAmountToEscrow,
          paymentType: "Paiement final",
        },
        connection,
      );
    }

    if (finalAmountToEscrow > 0) {
      await debitWallet(clientId, finalAmountToEscrow, connection);
      const clientBalanceAfter = roundMoney(clientBalanceBefore - finalAmountToEscrow);
      await createTransaction({
        walletId: clientWallet.id,
        dealId,
        type: "final_debit",
        amount: finalAmountToEscrow,
        balanceBefore: clientBalanceBefore,
        balanceAfter: clientBalanceAfter,
      }, connection);

      await createTransaction({
        walletId: systemWallet.id,
        dealId,
        type: "final_credit",
        amount: finalAmountToEscrow,
        balanceBefore: Number(systemWallet.balance),
        balanceAfter: roundMoney(Number(systemWallet.balance) + finalAmountToEscrow),
        note: "Paiement final place en sequestre (wallet 999) jusqu'au paiement total et a la liberation des fonds.",
      }, connection);

      await creditWallet(systemWallet.owner_id, finalAmountToEscrow, connection);
    }

    if (payment) {
      await paymentRepo.updatePaymentStatus(payment.id, "Paye", connection);
    }

    const note = finalAmountToEscrow > 0
      ? "Paiement final confirme. Le sequestre total est libere au freelancer."
      : "Paiement final confirme sans montant supplementaire.";

    const nextDealStatus = deal?.submittedAt ? "Terminé" : "Totalité payée";

    await updateDealAfterPayment(connection, {
      dealId,
      note,
      status: nextDealStatus,
      penaltyCycles: Number(deal?.penaltyCycles ?? 0),
    });

    const submissionRelease = await releaseFreelancerPaymentOnSubmission({ dealId }, connection);

    return {
      payment: payment ? { ...payment, status: "Paye" } : null,
      penalty: {
        daysLate: 0,
        cycles: 0,
        amount: 0,
        amountFromFinal: 0,
        amountFromEscrow: 0,
      },
      deal: await dealRepository.findById(dealId, connection),
      submissionRelease,
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

export async function releaseAdvancePaymentOnDeadline({ dealId }, externalConnection = null) {
  return { released: false, reason: "disabled" };
  const execute = async (connection) => {
    const deal = await dealRepository.findById(dealId, connection);
    if (!deal) {
      throw new Error("Deal introuvable.");
    }

    const dealStatus = String(deal?.status || "");
    if (["Annule", "Annulé"].includes(dealStatus)) {
      return { released: false, reason: "deal_cancelled" };
    }

    if (!isDealDeadlineReached(deal?.deadline)) {
      return { released: false, reason: "deadline_not_reached" };
    }

    const advancePaid = await isPaymentTypePaid(connection, dealId, "Avance");
    if (!advancePaid) {
      return { released: false, reason: "advance_not_paid" };
    }

    await ensureSystemWalletOwner(connection);
    const systemWallet = await findSystemWallet(connection);
    const freelancerId = Number(deal.freelancerId || deal.freelancer_id);
    const freelancerWallet = await findWalletByOwnerId(freelancerId, connection);
    const advanceAmount = roundMoney(Number(deal.advanceAmount || deal.advance_amount || 0));
    const finalPaid = await isPaymentTypePaid(connection, dealId, "Paiement final");
    const finalPayment = finalPaid
      ? await paymentRepo.findPaymentByDealAndType(dealId, "Paiement final", connection)
      : null;
    const finalEscrowAmount = roundMoney(Number(finalPayment?.amount || 0));

    const alreadyReleasedToFreelancer = await getWalletTransactionAmountByType(connection, {
      walletId: freelancerWallet.id,
      dealId,
      type: "submission_release",
    });

    const alreadyReleasedAdvance = roundMoney(
      Math.max(alreadyReleasedToFreelancer - finalEscrowAmount, 0),
    );
    const remainingAdvanceRelease = roundMoney(
      Math.max(advanceAmount - alreadyReleasedAdvance, 0),
    );

    if (remainingAdvanceRelease <= 0) {
      return { released: false, reason: "advance_already_released" };
    }

    if (Number(systemWallet.balance) < remainingAdvanceRelease) {
      throw new Error(`Wallet systeme insuffisant pour la liberation de l'avance du deal #${dealId}.`);
    }

    const systemBalanceBefore = Number(systemWallet.balance);
    await debitWallet(systemWallet.owner_id, remainingAdvanceRelease, connection);
    await createTransaction({
      walletId: systemWallet.id,
      dealId,
      type: "submission_release",
      amount: remainingAdvanceRelease,
      balanceBefore: systemBalanceBefore,
      balanceAfter: roundMoney(systemBalanceBefore - remainingAdvanceRelease),
      note: "Liberation de l'avance a la date limite du deal.",
    }, connection);

    const freelancerBalanceBefore = Number(freelancerWallet.balance);
    await creditWallet(freelancerId, remainingAdvanceRelease, connection);
    await createTransaction({
      walletId: freelancerWallet.id,
      dealId,
      type: "submission_release",
      amount: remainingAdvanceRelease,
      balanceBefore: freelancerBalanceBefore,
      balanceAfter: roundMoney(freelancerBalanceBefore + remainingAdvanceRelease),
      note: "Avance liberee automatiquement a la date limite du deal.",
    }, connection);

    return {
      released: true,
      dealId,
      releasedAmount: remainingAdvanceRelease,
    };
  };

  if (externalConnection) {
    return execute(externalConnection);
  }

  return runPaymentTransaction(execute);
}

export async function releaseFreelancerPaymentOnSubmission({ dealId }, externalConnection = null) {
  const execute = async (connection) => {
    const deal = await dealRepository.findById(dealId, connection);
    if (!deal) {
      throw new Error("Deal introuvable.");
    }

    const dealStatus = String(deal?.status || "");
    if (["Annule", "Annulé"].includes(dealStatus)) {
      throw new Error("Le deal est annule.");
    }

    const freelancerId = Number(deal.freelancerId || deal.freelancer_id);
    const clientId = Number(deal.clientId || deal.client_id);
    const advanceAmount = roundMoney(Number(deal.advanceAmount || deal.advance_amount || 0));
    const advancePaid = await isPaymentTypePaid(connection, dealId, "Avance");
    const finalPaid = await isPaymentTypePaid(connection, dealId, "Paiement final");
    const finalPayment = finalPaid
      ? await paymentRepo.findPaymentByDealAndType(dealId, "Paiement final", connection)
      : null;
    const finalEscrowAmount = roundMoney(Number(finalPayment?.amount || 0));
    const escrowAmount = roundMoney((advancePaid ? advanceAmount : 0) + finalEscrowAmount);

    if (escrowAmount <= 0) {
      return { released: false, reason: "escrow_not_paid" };
    }

    await ensureSystemWalletOwner(connection);
    const systemWallet = await findSystemWallet(connection);
    const freelancerWallet = await findWalletByOwnerId(freelancerId, connection);
    const clientWallet = await findWalletByOwnerId(clientId, connection);

    const alreadyReleasedFromSystem = await getWalletTransactionAmountByType(connection, {
      walletId: systemWallet.id,
      dealId,
      type: "submission_release",
    });
    const alreadyReleasedToFreelancer = await getWalletTransactionAmountByType(connection, {
      walletId: freelancerWallet.id,
      dealId,
      type: "submission_release",
    });
    const alreadyReturnedToClient = await getWalletTransactionAmountByType(connection, {
      walletId: clientWallet.id,
      dealId,
      type: "penalty_credit",
    });

    const penalty = computeDelayPenalty(deal);
    const penaltyAmount = roundMoney(Math.max(Number(penalty.penaltyAmount || 0), 0));
    const targetPenaltyReturnAmount = roundMoney(Math.min(penaltyAmount, escrowAmount));
    const targetReleaseToFreelancer = roundMoney(Math.max(escrowAmount - targetPenaltyReturnAmount, 0));
    const remainingEscrowToRelease = roundMoney(Math.max(escrowAmount - alreadyReleasedFromSystem, 0));
    const remainingReleaseToFreelancer = roundMoney(
      Math.max(targetReleaseToFreelancer - alreadyReleasedToFreelancer, 0),
    );
    const remainingPenaltyReturnAmount = roundMoney(
      Math.max(targetPenaltyReturnAmount - alreadyReturnedToClient, 0),
    );

    if (remainingEscrowToRelease <= 0 && remainingReleaseToFreelancer <= 0 && remainingPenaltyReturnAmount <= 0) {
      return { released: false, reason: "already_released" };
    }

    if (Number(systemWallet.balance) < remainingEscrowToRelease) {
      throw new Error(`Wallet systeme insuffisant pour la liberation du paiement freelance du deal #${dealId}.`);
    }

    const systemBalanceBefore = Number(systemWallet.balance);
    const systemBalanceAfter = roundMoney(systemBalanceBefore - remainingEscrowToRelease);
    if (remainingEscrowToRelease > 0) {
      await debitWallet(systemWallet.owner_id, remainingEscrowToRelease, connection);
      await createTransaction({
        walletId: systemWallet.id,
        dealId,
        type: "submission_release",
        amount: remainingEscrowToRelease,
        balanceBefore: systemBalanceBefore,
        balanceAfter: systemBalanceAfter,
        note: "Liberation du sequestre vers le freelancer apres paiement total.",
      }, connection);
    }

    if (remainingReleaseToFreelancer > 0) {
      const freelancerBalanceBefore = Number(freelancerWallet.balance);
      await creditWallet(freelancerId, remainingReleaseToFreelancer, connection);
      await createTransaction({
        walletId: freelancerWallet.id,
        dealId,
        type: "submission_release",
        amount: remainingReleaseToFreelancer,
        balanceBefore: freelancerBalanceBefore,
        balanceAfter: roundMoney(freelancerBalanceBefore + remainingReleaseToFreelancer),
        note: `Paiement libere au freelancer apres paiement total. Penalite appliquee: ${targetPenaltyReturnAmount.toFixed(2)} DT (${penalty.cycles} cycle(s), ${penalty.daysLate} jour(s) de retard).`,
      }, connection);
    }

    if (remainingPenaltyReturnAmount > 0) {
      const clientBalanceBefore = Number(clientWallet.balance);
      await creditWallet(clientId, remainingPenaltyReturnAmount, connection);
      const clientBalanceAfterPenalty = roundMoney(clientBalanceBefore + remainingPenaltyReturnAmount);
      await createTransaction({
        walletId: clientWallet.id,
        dealId,
        type: "penalty_credit",
        amount: remainingPenaltyReturnAmount,
        balanceBefore: clientBalanceBefore,
        balanceAfter: clientBalanceAfterPenalty,
        note: `Penalite de retard creditee au client: ${remainingPenaltyReturnAmount.toFixed(2)} DT.`,
      }, connection);
    }

    const note = penalty.hasPenalty
      ? `Travail soumis. Penalite appliquee: ${targetPenaltyReturnAmount.toFixed(2)} DT (${penalty.cycles} cycle(s), ${penalty.daysLate} jour(s) de retard). Montant total verse au freelance: ${targetReleaseToFreelancer.toFixed(2)} DT.`
      : `Paiement total confirme. Montant total verse au freelance: ${targetReleaseToFreelancer.toFixed(2)} DT.`;

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
      releasedAmount: remainingReleaseToFreelancer,
      totalReleasedAmount: targetReleaseToFreelancer,
      penaltyDeducted: remainingPenaltyReturnAmount,
      finalNetAmount: targetReleaseToFreelancer,
    };
  };

  if (externalConnection) {
    return execute(externalConnection);
  }

  return runPaymentTransaction(execute);
}
