import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import { validate } from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { createReview, getreviewStatus, listReviewsForUser, updateReview, deleteReview } from "./review.controller.js";
import { createReviewSchema } from "./review.validation.js";

const router = Router();

router.get("/status", asyncHandler(getreviewStatus));
router.get("/user/:userId", asyncHandler(listReviewsForUser));

router.use(authenticate);

router.post("/", validate(createReviewSchema), asyncHandler(createReview));
router.patch("/:reviewId", validate(createReviewSchema), asyncHandler(updateReview));
router.delete("/:reviewId", asyncHandler(deleteReview));

export default router;
