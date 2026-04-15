export function validateAdvancePayment(req, res, next) {
  const { dealId, amount } = req.body;

  if (!dealId || isNaN(Number(dealId))) {
    return res.status(422).json({ message: "Le champ 'dealId' est requis." });
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(422).json({ message: "Le champ 'amount' doit etre superieur a 0." });
  }

  next();
}

export const validateFinalPayment = validateAdvancePayment;

export function validateTotalPayment(req, res, next) {
  const { dealId, totalAmount, advanceAmount } = req.body;

  if (!dealId || isNaN(Number(dealId))) {
    return res.status(422).json({ message: "Le champ 'dealId' est requis." });
  }
  if (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
    return res.status(422).json({ message: "Le champ 'totalAmount' doit etre superieur a 0." });
  }
  if (!advanceAmount || isNaN(Number(advanceAmount)) || Number(advanceAmount) <= 0) {
    return res.status(422).json({ message: "Le champ 'advanceAmount' doit etre superieur a 0." });
  }

  next();
}

export function validateRefund(req, res, next) {
  const paymentId = Number(req.params.paymentId);
  if (!paymentId || isNaN(paymentId)) {
    return res.status(422).json({ message: "L'identifiant du paiement est invalide." });
  }
  next();
}
