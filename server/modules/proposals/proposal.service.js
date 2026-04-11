import AppError from "../../utils/AppError.js";
import { dealRepository } from "../deals/deal.repository.js";
import { getDb } from "../../config/db.js";
import { requestRepository } from "../requests/request.repository.js";
import { proposalRepository } from "./proposal.repository.js";

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
        "Cette proposition a deja ete traitee.",
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

    const connection = await db.getConnection();
    let createdOrExistingDeal = null;

    try {
      await connection.beginTransaction();
      await proposalRepository.updateStatus(normalizedProposalId, "Acceptee", connection);
      await proposalRepository.rejectOtherProposals(proposal.requestId, normalizedProposalId, connection);
      await requestRepository.markStatus(proposal.requestId, "En cours", connection);

      const request = await requestRepository.findById(proposal.requestId, connection);
      const existingDeal = await dealRepository.findByProposalId(normalizedProposalId, connection);

      if (!existingDeal && request) {
        createdOrExistingDeal = await dealRepository.createFromAcceptedProposal(
          proposal,
          request,
          connection,
        );
      } else {
        createdOrExistingDeal = existingDeal;
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const updatedProposal = await proposalRepository.findById(normalizedProposalId);
    const finalDeal =
      createdOrExistingDeal ?? (await dealRepository.findByProposalId(normalizedProposalId));

    return {
      proposal: updatedProposal,
      deal: finalDeal,
    };
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
};
