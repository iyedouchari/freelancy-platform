import AppError from "../../utils/AppError.js";
import { dealRepository } from "../deals/deal.repository.js";
import { getDb } from "../../config/db.js";
import { requestRepository } from "../requests/request.repository.js";
import { proposalRepository } from "./proposal.repository.js";
import {
  findWalletByOwnerId,
  debitWallet,
  ensureSystemWalletOwner,
  findSystemWallet,
  creditWallet,
  createTransaction,
} from "../wallet/wallet.repository.js";
import {
  createPayment,
  updatePaymentStatus,
} from "../payments/payment.repository.js";
import { stripeDummy } from "../payments/payment.service.js";

const db = getDb();

const isAdmin = (role) => role === "admin";

const ensurePositiveId = (value, label) => {
  const id = Number.parseInt(value, 10);

  if (Number.isNaN(id) || id <= 0) {
    throw new AppError(`${label} invalide.`, 400, "INVALID_ID");
  }

  return id;
};

const assertClientOwnsRequest = async (proposal, userId, role) => {
  if (isAdmin(role)) {
    return;
  }

  const owner = await requestRepository.isOwner(proposal.requestId, userId);

  if (!owner) {
    throw new AppError("Action non autorisee.", 403, "FORBIDDEN");
  }
};

export const proposalService = {
  async listByRequest(requestId) {
    const normalizedRequestId = ensurePositiveId(requestId, "Request id");
    const request = await requestRepository.findById(normalizedRequestId);

    if (!request) {
      throw new AppError("Demande introuvable.", 404, "REQUEST_NOT_FOUND");
    }

    return proposalRepository.findByRequestId(normalizedRequestId);
  },

  async listMine(userId, role) {
    if (!isAdmin(role) && role !== "freelancer") {
      throw new AppError("Action non autorisee.", 403, "FORBIDDEN");
    }

    return proposalRepository.findByFreelancerId(userId);
  },

  async createProposal(user, data) {
    if (user.role !== "freelancer") {
      throw new AppError(
        "Seuls les freelancers peuvent envoyer une proposition.",
        403,
        "FORBIDDEN",
      );
    }

    const requestId = ensurePositiveId(data.requestId, "Request id");
    const request = await requestRepository.findById(requestId);

    if (!request) {
      throw new AppError("Demande introuvable.", 404, "REQUEST_NOT_FOUND");
    }

    if (request.status !== "Ouverte") {
      throw new AppError(
        "Cette demande n'accepte plus de nouvelles propositions.",
        400,
        "REQUEST_CLOSED",
      );
    }

    const existingProposal = await proposalRepository.findByRequestAndFreelancer(requestId, user.id);
    if (existingProposal) {
      throw new AppError(
        "Vous avez deja envoye une proposition pour cette demande.",
        409,
        "PROPOSAL_ALREADY_EXISTS",
      );
    }

    const proposedPrice = request.negotiable ? data.proposedPrice ?? request.budget : request.budget;
    const proposedDeadline = request.negotiable
      ? data.proposedDeadline ?? request.deadline
      : request.deadline;

    if (!proposedPrice || !proposedDeadline) {
      throw new AppError(
        "Le prix et la date limite de la proposition sont requis.",
        400,
        "PROPOSAL_FIELDS_REQUIRED",
      );
    }

    return proposalRepository.create({
      requestId,
      freelancerId: user.id,
      proposedPrice,
      proposedDeadline,
      coverLetter: data.coverLetter,
    });
  },

  async changeStatus(proposalId, status, userId, role) {
    const normalizedProposalId = ensurePositiveId(proposalId, "Proposal id");
    const proposal = await proposalRepository.findById(normalizedProposalId);

    if (!proposal) {
      throw new AppError("Proposition introuvable.", 404, "PROPOSAL_NOT_FOUND");
    }

    await assertClientOwnsRequest(proposal, userId, role);

    if (proposal.status !== "En attente") {
      throw new AppError(
        "Cette proposition a deja été traitee.",
        400,
        "PROPOSAL_ALREADY_DECIDED",
      );
    }

    if (status === "Refusee") {
      const updatedProposal = await proposalRepository.updateStatus(normalizedProposalId, status);
      return {
        proposal: updatedProposal,
        deal: null,
      };
    }
    throw new AppError(
      "Utilisez l'action d'acceptation avec paiement de l'avance. Le deal ne commence qu'apres le paiement.",
      400,
      "ADVANCE_PAYMENT_REQUIRED",
    );
  },

  async sendClientResponse(proposalId, userId, role, payload) {
    const normalizedProposalId = ensurePositiveId(proposalId, "Proposal id");
    const proposal = await proposalRepository.findById(normalizedProposalId);

    if (!proposal) {
      throw new AppError("Proposition introuvable.", 404, "PROPOSAL_NOT_FOUND");
    }

    await assertClientOwnsRequest(proposal, userId, role);

    if (!proposal.requestNegotiable) {
      throw new AppError(
        "La demande n'est pas negociable, aucune contre-offre n'est autorisee.",
        400,
        "REQUEST_NOT_NEGOTIABLE",
      );
    }

    const responsePayload =
      payload.responseType === "same_terms"
        ? {
            responseType: "same_terms",
            price: proposal.requestBudget,
            deadline: proposal.requestDeadline,
          }
        : {
            responseType: "counter_offer",
            price: payload.price,
            deadline: payload.deadline,
          };

    return proposalRepository.setClientResponse(normalizedProposalId, responsePayload);
  },

  async acceptAndPay(proposalId, userId, role) {
    const normalizedProposalId = ensurePositiveId(proposalId, "Proposal id");
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Fetch proposal and check if it can be accepted
      const proposal = await proposalRepository.findById(normalizedProposalId, connection);
      if (!proposal) {
        throw new AppError("Proposition introuvable.", 404, "PROPOSAL_NOT_FOUND");
      }

      await assertClientOwnsRequest(proposal, userId, role);

      if (proposal.status !== "En attente") {
        throw new AppError(
          "Cette proposition a deja été traitee.",
          400,
          "PROPOSAL_ALREADY_DECIDED",
        );
      }

      const advanceAmount = Number((proposal.proposedPrice * 0.3).toFixed(2));

      // 2. Functions imported at file top

      // 3. Check client balance
      const clientWallet = await findWalletByOwnerId(userId, connection);
      if (!clientWallet || Number(clientWallet.balance) < advanceAmount) {
        throw new AppError(
          "Solde insuffisant dans votre portefeuille pour payer l'avance (30%).",
          400,
          "INSUFFICIENT_FUNDS",
        );
      }

      // 4. Update proposal status
      await proposalRepository.updateStatus(normalizedProposalId, "Acceptee", connection);
      await proposalRepository.rejectOtherProposals(
        proposal.requestId,
        normalizedProposalId,
        connection,
      );
      await requestRepository.markStatus(proposal.requestId, "En cours", connection);

      // 5. Create the deal
      let deal = await dealRepository.findByProposalId(normalizedProposalId, connection);
      if (!deal) {
        const request = await requestRepository.findById(proposal.requestId, connection);
        deal = await dealRepository.createFromAcceptedProposal(proposal, request, connection);
      }

      // 6. Record payment and transactions
      await stripeDummy({
        amount: advanceAmount,
        metadata: { dealId: deal.id, type: "Avance", clientId: userId },
      });

      await debitWallet(userId, advanceAmount, connection);

      // System wallet credit
      await ensureSystemWalletOwner(connection);
      const systemWallet = await findSystemWallet(connection);
      await creditWallet(systemWallet.owner_id, advanceAmount, connection);

      // Create transactions
      await createTransaction(
        {
          walletId: clientWallet.id,
          dealId: deal.id,
          type: "advance_debit",
          amount: advanceAmount,
          balanceBefore: Number(clientWallet.balance),
          balanceAfter: Number(clientWallet.balance) - advanceAmount,
        },
        connection,
      );

      await createTransaction(
        {
          walletId: systemWallet.id,
          dealId: deal.id,
          type: "advance_credit",
          amount: advanceAmount,
          balanceBefore: Number(systemWallet.balance),
          balanceAfter: Number(systemWallet.balance) + advanceAmount,
        },
        connection,
      );

      // Create payment record
      const payment = await createPayment(
        {
          dealId: deal.id,
          clientId: userId,
          freelancerId: proposal.freelancerId,
          amount: advanceAmount,
          paymentType: "Avance",
        },
        connection,
      );
      await updatePaymentStatus(payment.id, "Paye", connection);

      // 7. Update deal status to 'En cours' and add note
      const remainingAmount = Math.max(Number(proposal.proposedPrice) - advanceAmount, 0);
      const deadlineStr = new Date(proposal.proposedDeadline).toLocaleDateString("fr-FR");
      const note = `Avance payee. Reste a payer : ${remainingAmount.toFixed(2)} DT avant le ${deadlineStr}.`;

      await connection.query(
        "UPDATE deals SET status = 'En cours', payment_note = ?, advance_amount = ? WHERE id = ?",
        [note, advanceAmount, deal.id],
      );

      await connection.commit();

      return {
        proposal: await proposalRepository.findById(normalizedProposalId),
        deal: await dealRepository.findById(deal.id),
      };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },
};
