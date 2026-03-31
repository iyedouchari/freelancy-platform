// ─── payment.validation.js ───────────────────────────────────────────────────

export function validateAdvancePayment(req, res, next) {
  const { dealId, freelancerId, amount } = req.body;

  if (!dealId || isNaN(Number(dealId))) {
    return res.status(422).json({ message: "Le champ 'dealId' est requis." });
  }
  if (!freelancerId || isNaN(Number(freelancerId))) {
    return res.status(422).json({ message: "Le champ 'freelancerId' est requis." });
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(422).json({ message: "Le champ 'amount' doit être supérieur à 0." });
  }

  next();
}

export const validateFinalPayment = validateAdvancePayment;

export function validateRefund(req, res, next) {
  const paymentId = Number(req.params.paymentId);
  if (!paymentId || isNaN(paymentId)) {
    return res.status(422).json({ message: "L'identifiant du paiement est invalide." });
  }
  next();
}