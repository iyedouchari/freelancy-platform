import Joi from "joi";
// Schéma de validation pour la création d'un avis, qui vérifie que les champs nécessaires sont présents et conformes aux attentes, et que les champs optionnels sont correctement formatés si fournis
export const createReviewSchema = Joi.object({
  dealId: Joi.number().integer().positive(),
  proposalId: Joi.number().integer().positive(),
  toUserId: Joi.number().integer().positive().required(),
  score: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().min(5).max(2000).required(),
})
  .or("dealId", "proposalId")
  .unknown(false);
// Schéma de validation pour la mise à jour d'un avis, qui vérifie que les champs nécessaires sont présents et conformes aux attentes, et que les champs optionnels sont correctement formatés si fournis
export const updateReviewSchema = Joi.object({
  score: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().min(5).max(2000).required(),
}).unknown(false);
