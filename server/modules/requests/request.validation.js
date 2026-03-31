export const validaterequestPayload = (payload) => {
  return payload || {};
};
import Joi from "joi";

export const createRequestSchema = Joi.object({
  title: Joi.string().min(5).max(150).required().messages({
    "string.min": "Le titre doit contenir au moins 5 caractères",
    "string.max": "Le titre ne peut pas dépasser 150 caractères",
    "any.required": "Le titre est obligatoire",
  }),
  description: Joi.string().min(20).max(5000).required().messages({
    "string.min": "La description doit contenir au moins 20 caractères",
    "any.required": "La description est obligatoire",
  }),
  category: Joi.string().required().messages({
    "any.required": "La catégorie est obligatoire",
  }),
  subcategory: Joi.string().optional(),
  budget_min: Joi.number().positive().optional(),
  budget_max: Joi.number().positive().greater(Joi.ref("budget_min")).optional().messages({
    "number.greater": "Le budget maximum doit être supérieur au budget minimum",
  }),
  budget_type: Joi.string().valid("fixed", "hourly").default("fixed"),
  deadline: Joi.date().greater("now").optional().messages({
    "date.greater": "La date limite doit être dans le futur",
  }),
  skills_required: Joi.array().items(Joi.string()).optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
});

export const updateRequestSchema = Joi.object({
  title: Joi.string().min(5).max(150).optional(),
  description: Joi.string().min(20).max(5000).optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  budget_min: Joi.number().positive().optional(),
  budget_max: Joi.number().positive().optional(),
  budget_type: Joi.string().valid("fixed", "hourly").optional(),
  deadline: Joi.date().greater("now").optional(),
  skills_required: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid("open", "in_progress", "completed", "cancelled").optional(),
});

export const listRequestsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  category: Joi.string().optional(),
  status: Joi.string().valid("open", "in_progress", "completed", "cancelled").optional(),
  budget_min: Joi.number().positive().optional(),
  budget_max: Joi.number().positive().optional(),
  search: Joi.string().optional(),
  sort: Joi.string().valid("created_at", "budget_max", "deadline").default("created_at"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});
