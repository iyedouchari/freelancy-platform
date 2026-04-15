import { successResponse } from "../../utils/apiResponse.js";
import { dealService } from "./deal.service.js";

export const getdealStatus = async (_req, res) => {
  return successResponse(res, {
    message: "deals module is operational.",
    data: {
      statuses: [
        "En cours",
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

export const getMyDeals = async (req, res) => {
  const deals = await dealService.listMyDeals(req.user);
  return res.json({ deals });
};

export const syncAcceptedDeal = async (req, res) => {
  const deal = await dealService.syncAcceptedDeal({
    clientId: req.user.id,
    payload: req.body,
  });

  return res.status(201).json({ deal });
};

export const updateDealStatus = async (req, res) => {
  const dealId = Number(req.params.dealId);
  if (!dealId || Number.isNaN(dealId)) {
    return res.status(422).json({ message: "Identifiant de deal invalide." });
  }

  const result = await dealService.updateDealStatus({
    dealId,
    clientId: req.user.id,
    newStatus: req.body?.newStatus,
  });

  return res.json(result);
};

export const getDealById = async (req, res) => {
  const deal = await dealService.getDealById(req.params.id, req.user);
  return successResponse(res, { data: deal });
};
