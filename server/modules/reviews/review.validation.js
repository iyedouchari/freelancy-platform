import Joi from "joi";

export const createReviewSchema = Joi.object({
  toUserId: Joi.number().integer().positive().required(),
  score: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(2000).allow("", null),
});
