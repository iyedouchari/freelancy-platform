import AppError from "../../utils/AppError.js";
import { reviewRepository } from "./review.repository.js";
import { dealRepository } from "../deals/deal.repository.js";
import { proposalRepository } from "../proposals/proposal.repository.js";

const ensurePositiveId = (value, label) => {
  const id = Number.parseInt(value, 10);

  if (Number.isNaN(id) || id <= 0) {
    throw new AppError(`${label} invalide.`, 400, "INVALID_ID");
  }

  return id;
};

export const reviewService = {
  async listForUser(userId) {
    const normalizedUserId = ensurePositiveId(userId, "User id");
    return reviewRepository.findByTargetUser(normalizedUserId);
  },

  async createReview(user, payload) {
    const hasDealId = payload.dealId !== undefined && payload.dealId !== null && payload.dealId !== "";
    const hasProposalId =
      payload.proposalId !== undefined && payload.proposalId !== null && payload.proposalId !== "";

    if (!hasDealId && !hasProposalId) {
      throw new AppError(
        "Un accord ou une proposition est requis pour enregistrer un avis.",
        400,
        "REVIEW_CONTEXT_REQUIRED",
      );
    }

    const dealId = hasDealId ? ensurePositiveId(payload.dealId, "Deal id") : null;
    const proposalId = hasProposalId ? ensurePositiveId(payload.proposalId, "Proposal id") : null;
    const toUserId = ensurePositiveId(payload.toUserId, "Target user id");

    if (user.id === toUserId) {
      throw new AppError(
        "Vous ne pouvez pas laisser un avis sur votre propre profil.",
        400,
        "SELF_REVIEW_FORBIDDEN",
      );
    }

    let expectedTargetUserId = null;

    if (dealId) {
      const deal = await dealRepository.findById(dealId);
      if (!deal) {
        throw new AppError("Accord introuvable.", 404, "DEAL_NOT_FOUND");
      }

      const isParticipant = [Number(deal.clientId), Number(deal.freelancerId)].includes(Number(user.id));
      if (!isParticipant) {
        throw new AppError("Action non autorisee pour cet accord.", 403, "FORBIDDEN");
      }

      expectedTargetUserId =
        Number(deal.clientId) === Number(user.id) ? Number(deal.freelancerId) : Number(deal.clientId);
    } else {
      const proposal = await proposalRepository.findById(proposalId);
      if (!proposal) {
        throw new AppError("Proposition introuvable.", 404, "PROPOSAL_NOT_FOUND");
      }

      const clientId = Number(proposal.requestClientId);
      const freelancerId = Number(proposal.freelancerId);
      const isParticipant = [clientId, freelancerId].includes(Number(user.id));

      if (!isParticipant) {
        throw new AppError("Action non autorisee pour cette proposition.", 403, "FORBIDDEN");
      }

      expectedTargetUserId = Number(user.id) === clientId ? freelancerId : clientId;
    }

    if (Number(toUserId) !== expectedTargetUserId) {
      throw new AppError("La cible de l'avis ne correspond pas a cet accord.", 400, "INVALID_REVIEW_TARGET");
    }

    const existingReview = await reviewRepository.findExisting(user.id, toUserId);
    if (existingReview) {
      return reviewRepository.update(existingReview.id, {
        score: payload.score,
        comment: payload.comment,
      });
    }

    return reviewRepository.create({
      dealId,
      fromUserId: user.id,
      toUserId,
      score: payload.score,
      comment: payload.comment,
    });
  },

  async updateReview(user, reviewId, payload) {
    const normalizedReviewId = ensurePositiveId(reviewId, "Review id");
    const review = await reviewRepository.findById(normalizedReviewId);

    if (!review) {
      throw new AppError("Avis introuvable.", 404, "REVIEW_NOT_FOUND");
    }

    if (Number(review.from_user_id) !== Number(user.id)) {
      throw new AppError(
        "Vous ne pouvez modifier que vos propres avis.",
        403,
        "FORBIDDEN",
      );
    }

    return reviewRepository.update(normalizedReviewId, {
      score: payload.score,
      comment: payload.comment,
    });
  },

  async deleteReview(user, reviewId) {
    const normalizedReviewId = ensurePositiveId(reviewId, "Review id");
    const review = await reviewRepository.findById(normalizedReviewId);

    if (!review) {
      throw new AppError("Avis introuvable.", 404, "REVIEW_NOT_FOUND");
    }

    if (Number(review.from_user_id) !== Number(user.id)) {
      throw new AppError(
        "Vous ne pouvez supprimer que vos propres avis.",
        403,
        "FORBIDDEN",
      );
    }

    await reviewRepository.delete(normalizedReviewId);
    return { message: "Avis supprime avec succes." };
  },
};
