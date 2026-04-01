import { sendSuccess, successResponse } from "../../utils/apiResponse.js";
import { reviewService } from "./review.service.js";

export const getreviewStatus = async (_req, res) => {
  return successResponse(res, {
    message: "reviews module is ready.",
    data: {
      routes: ["GET /api/reviews/user/:userId", "POST /api/reviews"],
    },
  });
};

export const listReviewsForUser = async (req, res) => {
  const reviews = await reviewService.listForUser(req.params.userId);
  return sendSuccess(res, reviews, "Liste des avis.");
};

export const createReview = async (req, res) => {
  const review = await reviewService.createReview(req.user, req.body);
  return sendSuccess(res, review, "Avis ajoute.", 201);
};
