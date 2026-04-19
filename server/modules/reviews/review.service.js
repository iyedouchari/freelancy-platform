import AppError from "../../utils/AppError.js";
import { reviewRepository } from "./review.repository.js";
import { dealRepository } from "../deals/deal.repository.js";
import { proposalRepository } from "../proposals/proposal.repository.js";

// Permet de valider que les identifiants fournis sont des nombres entiers positifs, en lançant une erreur personnalisée si la validation échoue
const ensurePositiveId = (value, label) => {
  const id = Number.parseInt(value, 10);

  if (Number.isNaN(id) || id <= 0) {
    throw new AppError(`${label} invalide.`, 400, "INVALID_ID");
  }

  return id;
};
// Permet de récupérer la liste des avis reçus par un utilisateur spécifique, en utilisant le repository pour interagir avec la base de données et en retournant les avis formatés
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

    if (user.id === toUserId) {// On vérifie que l'utilisateur ne tente pas de laisser un avis sur son propre profil, ce qui n'est pas autorisé, et on lance une erreur personnalisée si c'est le cas
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
// On vérifie que l'utilisateur est bien impliqué dans la proposition, soit en tant que client qui a reçu la proposition, soit en tant que freelancer qui a soumis la proposition, sinon on lance une erreur personnalisée
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
// Si aucun avis existant n'est trouvé pour ce couple d'utilisateurs, on crée un nouvel avis dans la base de données en utilisant le repository, et on retourne l'objet du nouvel avis créé
    return reviewRepository.create({
      dealId,
      fromUserId: user.id,
      toUserId,
      score: payload.score,
      comment: payload.comment,
    });
  },
// Permet de mettre à jour un avis existant en vérifiant que l'utilisateur connecté est autorisé à modifier l'avis, puis en retournant l'avis mis à jour
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
// Permet de supprimer un avis existant en vérifiant que l'utilisateur connecté est autorisé à supprimer l'avis, puis en retournant un message de succès si la suppression a réussi
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
    // Si la suppression a réussi, on retourne un message de succès indiquant que l'avis a été supprimé avec succès
  },
};
