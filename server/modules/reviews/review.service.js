import AppError from "../../utils/AppError.js";
import { reviewRepository } from "./review.repository.js";
import { dealRepository } from "../deals/deal.repository.js";

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
    const dealId = ensurePositiveId(payload.dealId, "Deal id");
    const toUserId = ensurePositiveId(payload.toUserId, "Target user id");

    if (user.id === toUserId) {
      throw new AppError(
        "Vous ne pouvez pas laisser un avis sur votre propre profil.",
        400,
        "SELF_REVIEW_FORBIDDEN",
      );
    }

    const deal = await dealRepository.findById(dealId);
    if (!deal) {
      throw new AppError("Accord introuvable.", 404, "DEAL_NOT_FOUND");
    }

    const isParticipant = [Number(deal.clientId), Number(deal.freelancerId)].includes(Number(user.id));
    if (!isParticipant) {
      throw new AppError("Action non autorisee pour cet accord.", 403, "FORBIDDEN");
    }

    const expectedTargetUserId =
      Number(deal.clientId) === Number(user.id) ? Number(deal.freelancerId) : Number(deal.clientId);

    if (Number(toUserId) !== expectedTargetUserId) {
      throw new AppError("La cible de l'avis ne correspond pas a cet accord.", 400, "INVALID_REVIEW_TARGET");
    }

    const existingReview = await reviewRepository.findByDealAndAuthor(dealId, user.id);
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
};
