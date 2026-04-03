import { successResponse } from "../../utils/apiResponse.js";
import { dealService } from "./deal.service.js";

export const getdealStatus = async (_req, res) => {
  return successResponse(res, {
    message: "deals module is operational.",
    data: {
      statuses: [
        "En attente acompte",
        "Actif",
        "Soumis",
        "En attente paiement final",
        "Termine",
        "Annule",
      ],
    },
  });
};

export const listDeals = async (req, res) => {
  const deals = await dealService.listDeals(req.user);
  return successResponse(res, { data: deals });
};

export const getDealById = async (req, res) => {
  const deal = await dealService.getDealById(req.params.id, req.user);
  return successResponse(res, { data: deal });
};
