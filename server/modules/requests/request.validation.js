import Joi from "joi";

const requestStatuses = ["Ouverte", "En cours", "Fermee"];

const requestBaseSchema = {
  title: Joi.string().trim().max(255).required().messages({
    "string.empty": "Le titre est requis",
    "string.max": "Le titre ne peut pas dépasser 255 caractères",
    "any.required": "Le titre est requis",
  }),
  description: Joi.string().trim().min(10).required().messages({
    "string.empty": "La description est requise",
    "string.min": "La description doit contenir au moins 10 caractères",
    "any.required": "La description est requise",
  }),
  domain: Joi.string().trim().max(100).optional(),
  category: Joi.string().trim().max(100).optional(),
  budget: Joi.number().positive().required().messages({
    "number.base": "Le budget doit etre un nombre",
    "number.positive": "Le budget doit etre superieur a 0",
    "any.required": "Le budget est requis",
  }),
  negotiable: Joi.boolean().default(true),
  deadline: Joi.date().iso().required().messages({
    "date.base": "Format de date invalide",
    "date.format": "Format YYYY-MM-DD requis",
    "any.required": "La date limite est requise",
  }),
  skills: Joi.array().items(Joi.string().trim().max(80)).default([]),
};

export const createRequestSchema = Joi.object(requestBaseSchema).or("domain", "category");

export const updateRequestSchema = Joi.object({
  title: Joi.string().trim().max(255).optional(),
  description: Joi.string().trim().min(10).optional(),
  domain: Joi.string().trim().max(100).optional(),
  category: Joi.string().trim().max(100).optional(),
  budget: Joi.number().positive().optional(),
  negotiable: Joi.boolean().optional(),
  deadline: Joi.date().iso().optional(),
  skills: Joi.array().items(Joi.string().trim().max(80)).optional(),
  status: Joi.string().valid(...requestStatuses).optional(),
});

export const filterRequestSchema = Joi.object({
  domain: Joi.string().trim().max(100).optional(),
  status: Joi.string().valid(...requestStatuses).optional(),
  minBudget: Joi.number().positive().optional(),
  maxBudget: Joi.number().positive().optional(),
  negotiable: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("created_at", "budget", "deadline").default("created_at"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const changeStatusSchema = Joi.object({
  status: Joi.string().valid(...requestStatuses).required(),
});

export const domainBodySchema = Joi.object({
  domain: Joi.string().trim().min(1).max(100).required(),
});

export const domainParamSchema = Joi.object({
  domain: Joi.string().trim().min(1).max(100).required(),
});
