import * as paymentService from "./payment.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
// Permet de récupérer les paiements liés à un deal spécifique
export async function getPaymentsByDeal(req, res) {
  try {
    const payments = await paymentService.getPaymentsByDeal(req.params.dealId);
    return sendSuccess(res, payments, "Paiements récupérés");
  } catch (err) {
    console.error("Get payments error:", err);
    return sendError(res, err.message || "Erreur lors de la récupération des paiements", 400);
  }
}
// Permet de récupérer les paiements liés à un utilisateur spécifique (en tant que client ou freelancer)
export async function payAdvance(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    if (!dealId || !amount) {
      return sendError(res, "dealId et amount requis", 400, "MISSING_PARAMS");
    }
// On appelle la logique métier de paiement d'avance en fournissant les informations nécessaires, et on retourne le résultat avec un message de succès
    const result = await paymentService.payAdvance({
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      amount: Number(amount),
    });
// En cas de succès, on retourne une réponse avec les données du paiement et un message clair
    return sendSuccess(res, result, "Avance payée avec succès", 201);
  } catch (err) {
    console.error("Pay advance error:", err);
    const statusCode = err.message?.includes("insuffisant") ? 402 : 400;
    return sendError(res, err.message || "Erreur lors du paiement", statusCode);
  }
}
// Permet de récupérer les paiements liés à un utilisateur spécifique (en tant que client ou freelancer)
export async function payFinal(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    if (!dealId || !amount) {// On vérifie que les paramètres nécessaires sont présents dans la requête, sinon on retourne une erreur claire
      return sendError(res, "dealId et amount requis", 400, "MISSING_PARAMS");
    }

    const result = await paymentService.payFinal({// On appelle la logique métier de paiement final en fournissant les informations nécessaires, et on retourne le résultat avec un message de succès
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      amount: Number(amount),
    });

    return sendSuccess(res, result, "Paiement final effectué", 201);// En cas de succès, on retourne une réponse avec les données du paiement et un message clair
  } catch (err) {
    console.error("Pay final error:", err);
    const statusCode = err.message?.includes("insuffisant") ? 402 : 400;
    return sendError(res, err.message || "Erreur lors du paiement final", statusCode);
  }
}

export async function payTotal(req, res) {// Permet de payer le montant total d'un deal, en prenant en compte les avances déjà payées et en vérifiant que le client a suffisamment de fonds pour couvrir le montant total
  try {
    const { dealId, freelancerId, totalAmount, advanceAmount, deadline } = req.body;

    if (!dealId || !totalAmount || !advanceAmount) {
      return sendError(res, "dealId, totalAmount et advanceAmount requis", 400, "MISSING_PARAMS");
    }

    const result = await paymentService.payTotal({// On appelle la logique métier de paiement total en fournissant les informations nécessaires, et on retourne le résultat avec un message de succès
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      totalAmount: Number(totalAmount),
      advanceAmount: Number(advanceAmount),
      deadline,
    });

    return sendSuccess(res, result, "Paiement total effectué", 201);// En cas de succès, on retourne une réponse avec les données du paiement et un message clair
  } catch (err) {
    console.error("Pay total error:", err);
    const statusCode = err.message?.includes("insuffisant") ? 402 : 400;
    return sendError(res, err.message || "Erreur lors du paiement total", statusCode);
  }
}

export async function refundPayment(req, res) {// Permet de rembourser un paiement spécifique, en vérifiant que le paiement existe et que le client est autorisé à effectuer le remboursement, puis en appelant la logique métier de remboursement et en retournant le résultat avec un message de succès ou d'erreur selon le cas
  try {
    const result = await paymentService.refundPayment({
      paymentId: Number(req.params.paymentId),
      clientId: req.user.id,
    });

    return sendSuccess(res, result, "Remboursement effectué");// En cas de succès, on retourne une réponse avec les données du remboursement et un message clair
  } catch (err) {
    console.error("Refund error:", err);
    return sendError(res, err.message || "Erreur lors du remboursement", 400);// En cas d'erreur, on retourne une réponse d'erreur claire avec le message de l'erreur
  }
}
