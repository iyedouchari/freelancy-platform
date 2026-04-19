import Joi from "joi";
// Schéma de validation pour la création d'une proposition, qui vérifie que les champs nécessaires sont présents et conformes aux attentes, et que les champs optionnels sont correctement formatés si fournis
export const createProposalSchema = Joi.object({
  requestId: Joi.number().integer().positive().required(),
  proposedPrice: Joi.number().positive(),
  proposedDeadline: Joi.date().iso(),
  coverLetter: Joi.string().trim().max(5000).allow("", null),
});
// Schéma de validation pour la création d'une proposition, qui vérifie que les champs nécessaires sont présents et conformes aux attentes, et que les champs optionnels sont correctement formatés si fournis
export const proposalStatusSchema = Joi.object({
  status: Joi.string().valid("Acceptee", "Refusee", "Annulee").required(),
});
// Schéma de validation pour la réponse du client à une proposition, qui peut être soit une acceptation avec les mêmes termes, soit une contre-offre avec un nouveau prix et une nouvelle date limite
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
