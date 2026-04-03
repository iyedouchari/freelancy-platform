import AppError from "../../utils/AppError.js";
import { dealRepository } from "./deal.repository.js";

const canAccessDeal = (deal, user) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "client") {
    return deal.clientId === user.id;
  }

  if (user.role === "freelancer") {
    return deal.freelancerId === user.id;
  }

  return false;
};

export const dealService = {
  async listDeals(user) {
    return dealRepository.findForUser(
      {
        userId: user.id ?? user.userId,
        role: user.role,
      },
    );
  },

  async getDealById(dealId, user) {
    const deal = await dealRepository.findById(Number(dealId));

    if (!deal) {
      throw new AppError("Deal introuvable.", 404, "DEAL_NOT_FOUND");
    }

    if (!canAccessDeal(deal, user)) {
      throw new AppError("Action non autorisee.", 403, "FORBIDDEN");
    }

    return deal;
  },
};
