import * as paymentService from "./payment.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

export async function getPaymentsByDeal(req, res) {
  try {
    const payments = await paymentService.getPaymentsByDeal(req.params.dealId);
    return sendSuccess(res, payments, "Paiements récupérés");
  } catch (err) {
    console.error("Get payments error:", err);
    return sendError(res, err.message || "Erreur lors de la récupération des paiements", 400);
  }
}

export async function payAdvance(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    if (!dealId || !amount) {
      return sendError(res, "dealId et amount requis", 400, "MISSING_PARAMS");
    }

    const result = await paymentService.payAdvance({
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      amount: Number(amount),
    });

    return sendSuccess(res, result, "Avance payée avec succès", 201);
  } catch (err) {
    console.error("Pay advance error:", err);
    const statusCode = err.message?.includes("insuffisant") ? 402 : 400;
    return sendError(res, err.message || "Erreur lors du paiement", statusCode);
  }
}

export async function payFinal(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    if (!dealId || !amount) {
      return sendError(res, "dealId et amount requis", 400, "MISSING_PARAMS");
    }

    const result = await paymentService.payFinal({
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      amount: Number(amount),
    });

    return sendSuccess(res, result, "Paiement final effectué", 201);
  } catch (err) {
    console.error("Pay final error:", err);
    const statusCode = err.message?.includes("insuffisant") ? 402 : 400;
    return sendError(res, err.message || "Erreur lors du paiement final", statusCode);
  }
}

export async function payTotal(req, res) {
  try {
    const { dealId, freelancerId, totalAmount, advanceAmount, deadline } = req.body;

    if (!dealId || !totalAmount || !advanceAmount) {
      return sendError(res, "dealId, totalAmount et advanceAmount requis", 400, "MISSING_PARAMS");
    }

    const result = await paymentService.payTotal({
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      totalAmount: Number(totalAmount),
      advanceAmount: Number(advanceAmount),
      deadline,
    });

    return sendSuccess(res, result, "Paiement total effectué", 201);
  } catch (err) {
    console.error("Pay total error:", err);
    const statusCode = err.message?.includes("insuffisant") ? 402 : 400;
    return sendError(res, err.message || "Erreur lors du paiement total", statusCode);
  }
}

export async function refundPayment(req, res) {
  try {
    const result = await paymentService.refundPayment({
      paymentId: Number(req.params.paymentId),
      clientId: req.user.id,
    });

    return sendSuccess(res, result, "Remboursement effectué");
  } catch (err) {
    console.error("Refund error:", err);
    return sendError(res, err.message || "Erreur lors du remboursement", 400);
  }
}
