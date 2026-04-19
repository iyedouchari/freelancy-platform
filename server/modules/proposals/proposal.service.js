import AppError from "../../utils/AppError.js";
import { dealRepository } from "../deals/deal.repository.js";
import { getDb } from "../../config/db.js";
import { requestRepository } from "../requests/request.repository.js";
import { proposalRepository } from "./proposal.repository.js";
import { findWalletByOwnerId } from "../wallet/wallet.repository.js";
import { payAdvance } from "../payments/payment.service.js";

const db = getDb();
const ACCEPT_AND_PAY_STEP_TIMEOUT_MS = 10000;

const withStepTimeout = async (promise, stepLabel) => {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new AppError(`Timeout pendant ${stepLabel}.`, 504, "ACCEPT_AND_PAY_TIMEOUT"));
        }, ACCEPT_AND_PAY_STEP_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

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

const assertFreelancerOwnsProposal = (proposal, userId, role) => {
  if (isAdmin(role)) {
    return;
  }

  if (proposal.freelancerId !== userId) {
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

    if (proposal.status !== "En attente") {
      throw new AppError(
        "Cette proposition n'est plus modifiable.",
        400,
        "PROPOSAL_NOT_EDITABLE",
      );
    }

    if (status === "Refusee") {
      await assertClientOwnsRequest(proposal, userId, role);

      const updatedProposal = await proposalRepository.updateStatus(normalizedProposalId, status);
      return {
        proposal: updatedProposal,
        deal: null,
      };
    }

    if (status === "Annulee") {
      if (role !== "freelancer" && !isAdmin(role)) {
        throw new AppError(
          "Seul le freelancer proprietaire peut annuler cette proposition.",
          403,
          "FORBIDDEN",
        );
      }

      assertFreelancerOwnsProposal(proposal, userId, role);

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
      const proposal = await withStepTimeout(
        proposalRepository.findById(normalizedProposalId, connection),
        "lecture proposition",
      );
      if (!proposal) {
        throw new AppError("Proposition introuvable.", 404, "PROPOSAL_NOT_FOUND");
      }

      await withStepTimeout(
        assertClientOwnsRequest(proposal, userId, role),
        "verification proprietaire client",
      );

      if (proposal.status !== "En attente") {
        if (proposal.status === "Acceptee") {
          const existingDeal = await withStepTimeout(
            dealRepository.findByProposalId(normalizedProposalId, connection),
            "recherche deal existant",
          );

          await connection.commit();

          if (existingDeal) {
            return {
              proposal,
              deal: existingDeal,
            };
          }
        }

        throw new AppError(
          "Cette proposition a deja été traitee.",
          400,
          "PROPOSAL_ALREADY_DECIDED",
        );
      }

      const advanceAmount = Number((proposal.proposedPrice * 0.3).toFixed(2));

      // 2. Check client balance
      const clientWallet = await withStepTimeout(
        findWalletByOwnerId(userId, connection),
        "lecture wallet client",
      );
      if (!clientWallet || Number(clientWallet.balance) < advanceAmount) {
        throw new AppError(
          "Solde insuffisant dans votre portefeuille pour payer l'avance (30%).",
          400,
          "INSUFFICIENT_FUNDS",
        );
      }

      // 3. Update proposal status
      await withStepTimeout(
        proposalRepository.updateStatus(normalizedProposalId, "Acceptee", connection),
        "update statut proposition",
      );
      await withStepTimeout(
        proposalRepository.rejectOtherProposals(
          proposal.requestId,
          normalizedProposalId,
          connection,
        ),
        "refus autres propositions",
      );
      await withStepTimeout(
        requestRepository.markStatus(proposal.requestId, "En cours", connection),
        "update statut demande",
      );

      // 4. Create the deal
      let deal = await withStepTimeout(
        dealRepository.findByProposalId(normalizedProposalId, connection),
        "recherche deal",
      );
      if (!deal) {
        deal = await withStepTimeout(
          dealRepository.createFromAcceptedProposal(
            proposal,
            { clientId: proposal.requestClientId },
            connection,
          ),
          "creation deal",
        );
      }

      // 5. Pay advance in the same transaction to keep acceptance atomic.
      await withStepTimeout(
        payAdvance({
          dealId: deal.id,
          clientId: userId,
          freelancerId: proposal.freelancerId,
          amount: advanceAmount,
        }, connection),
        "paiement avance",
      );

      await connection.commit();

      return {
        proposal: await withStepTimeout(
          proposalRepository.findById(normalizedProposalId),
          "lecture proposition finale",
        ),
        deal: await withStepTimeout(
          dealRepository.findById(deal.id),
          "lecture deal final",
        ),
      };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },
};
