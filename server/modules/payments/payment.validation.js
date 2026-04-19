export function validateAdvancePayment(req, res, next) {
  const { dealId, amount } = req.body;

  if (!dealId || isNaN(Number(dealId))) {// On vérifie que le dealId est présent et est un nombre valide, sinon on retourne une erreur claire pour indiquer que le champ est requis et doit être un nombre
    return res.status(422).json({ message: "Le champ 'dealId' est requis." });
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(422).json({ message: "Le champ 'amount' doit etre superieur a 0." });
  }

  next();
}
// La validation pour le paiement final est la même que pour l'avance, car les champs requis sont les mêmes (dealId et amount), donc on peut réutiliser la même fonction de validation pour éviter la duplication de code
export const validateFinalPayment = validateAdvancePayment;
// La validation pour le paiement total nécessite de vérifier à la fois le dealId, le totalAmount et l'advanceAmount, car le paiement total doit prendre en compte les avances déjà payées et s'assurer que les montants sont valides
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
// La validation pour le remboursement nécessite de vérifier que l'identifiant du paiement est présent dans les paramètres de l'URL et est un nombre valide, sinon on retourne une erreur claire pour indiquer que le champ est requis et doit être un nombre
export function validateRefund(req, res, next) {
  const paymentId = Number(req.params.paymentId);
  if (!paymentId || isNaN(paymentId)) {
    return res.status(422).json({ message: "L'identifiant du paiement est invalide." });
  }
  next();
}
