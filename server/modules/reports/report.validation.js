import Joi from "joi";

export const createReportSchema = Joi.object({
  reportedUserId: Joi.number().integer().positive().required(),
  dealId: Joi.number().integer().positive().allow(null).optional(),
  reason: Joi.string().trim().min(3).max(120).required(),
  details: Joi.string().trim().allow("").max(2000).optional(),
});
