import { successResponse } from "../../utils/apiResponse.js";

// ─── payment.controller.js ───────────────────────────────────────────────────
// Reçoit req/res pour les endpoints /api/payments.

import * as paymentService from "./payment.service.js";

/**
 * GET /api/payments/deal/:dealId
 * Retourne tous les paiements liés à un deal.
 */
export async function getPaymentsByDeal(req, res) {
  try {
    const payments = await paymentService.getPaymentsByDeal(req.params.dealId);
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/payments/advance
 * Body : { dealId, freelancerId, amount }
 * Paye l'acompte — deal passe en 'Actif' via trigger.
 */
export async function payAdvance(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    const result = await paymentService.payAdvance({
      dealId:       Number(dealId),
      clientId:     req.user.id,
      freelancerId: Number(freelancerId),
      amount:       Number(amount),
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

/**
 * POST /api/payments/final
 * Body : { dealId, freelancerId, amount }
 * Paye le solde final — deal passe en 'Termine' via trigger.
 */
export async function payFinal(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    const result = await paymentService.payFinal({
      dealId:       Number(dealId),
      clientId:     req.user.id,
      freelancerId: Number(freelancerId),
      amount:       Number(amount),
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

/**
 * POST /api/payments/:paymentId/refund
 * Rembourse un paiement — deal passe en 'Annule' via trigger.
 */
export async function refundPayment(req, res) {
  try {
    const result = await paymentService.refundPayment({
      paymentId: Number(req.params.paymentId),
      clientId:  req.user.id,
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}