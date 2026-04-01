import AppError from "../../utils/AppError.js";
import { reviewRepository } from "./review.repository.js";

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
    const toUserId = ensurePositiveId(payload.toUserId, "Target user id");

    if (user.id === toUserId) {
      throw new AppError(
        "Vous ne pouvez pas laisser un avis sur votre propre profil.",
        400,
        "SELF_REVIEW_FORBIDDEN",
      );
    }

    const existingReview = await reviewRepository.findExisting(user.id, toUserId);
    if (existingReview) {
      throw new AppError(
        "Vous avez deja laisse un avis pour ce profil.",
        409,
        "REVIEW_ALREADY_EXISTS",
      );
    }

    return reviewRepository.create({
      fromUserId: user.id,
      toUserId,
      score: payload.score,
      comment: payload.comment,
    });
  },
};
