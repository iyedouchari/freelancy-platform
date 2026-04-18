import Joi from "joi";

export const createProposalSchema = Joi.object({
  requestId: Joi.number().integer().positive().required(),
  proposedPrice: Joi.number().positive(),
  proposedDeadline: Joi.date().iso(),
  coverLetter: Joi.string().trim().max(5000).allow("", null),
});

export const proposalStatusSchema = Joi.object({
  status: Joi.string().valid("Acceptee", "Refusee", "Annulee").required(),
});

export const clientProposalResponseSchema = Joi.object({
  responseType: Joi.string().valid("same_terms", "counter_offer").required(),
  price: Joi.when("responseType", {
    is: "counter_offer",
    then: Joi.number().positive().required(),
    otherwise: Joi.any().strip(),
  }),
  deadline: Joi.when("responseType", {
    is: "counter_offer",
    then: Joi.date().iso().required(),
    otherwise: Joi.any().strip(),
  }),
});
