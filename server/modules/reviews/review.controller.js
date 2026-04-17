import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { reviewService } from "./review.service.js";

export const getreviewStatus = async (_req, res) => {
  return sendSuccess(res, {
    routes: ["GET /api/reviews/user/:userId", "POST /api/reviews", "PATCH /api/reviews/:reviewId", "DELETE /api/reviews/:reviewId"],
  }, "Reviews module is ready");
};

export const listReviewsForUser = async (req, res) => {
  try {
    const reviews = await reviewService.listForUser(req.params.userId);
    return sendSuccess(res, reviews, "Liste des avis");
  } catch (err) {
    console.error("List reviews error:", err);
    return sendError(res, err.message || "Erreur lors de la récupération des avis", 400);
  }
};

export const createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.user, req.body);
    return sendSuccess(res, review, "Avis enregistré", 201);
  } catch (err) {
    console.error("Create review error:", err);
    const statusCode = err.statusCode || 400;
    return sendError(res, err.message || "Erreur lors de la création de l'avis", statusCode);
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await reviewService.updateReview(
      req.user,
      req.params.reviewId,
      req.body,
    );
    return sendSuccess(res, review, "Avis modifié avec succès");
  } catch (err) {
    console.error("Update review error:", err);
    const statusCode = err.statusCode || 400;
    return sendError(res, err.message || "Erreur lors de la modification de l'avis", statusCode);
  }
};

export const deleteReview = async (req, res) => {
  try {
    const result = await reviewService.deleteReview(
      req.user,
      req.params.reviewId,
    );
    return sendSuccess(res, result, "Avis supprimé avec succès");
  } catch (err) {
    console.error("Delete review error:", err);
    const statusCode = err.statusCode || 400;
    return sendError(res, err.message || "Erreur lors de la suppression de l'avis", statusCode);
  }
};
