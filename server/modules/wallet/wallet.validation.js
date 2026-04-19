export function validateTopup(req, res, next) {
  const amount = Number(req.body.amount);

  if (!req.body.amount || isNaN(amount) || amount <= 0) {
    return res.status(422).json({ message: "Le montant doit etre superieur a 0." });
  }
  if (amount > 100000) {
    return res.status(422).json({ message: "Le montant ne peut pas depasser 100 000 DT." });
  }

  next();
}
// Permet de valider les données de la requête pour le retrait du portefeuille, en vérifiant que le montant est un nombre valide et supérieur ou égal à 100, et que les informations de compte bancaire sont fournies, avant de passer au middleware suivant ou au contrôleur
export function validateWithdraw(req, res, next) {
  const amount = Number(req.body.amount);

  if (!req.body.amount || isNaN(amount) || amount < 100) {
    return res.status(422).json({ message: "Le montant minimum de retrait est de 100 DT." });
  }
  if (amount > 50000) {
    return res.status(422).json({ message: "Le montant ne peut pas depasser 50 000 DT." });
  }
  if (!req.body.bankAccountMasked) {
    return res.status(422).json({ message: "Le champ 'bankAccountMasked' est requis." });
  }

  next();
}
// Permet de valider les paramètres de la requête pour récupérer le résumé des paiements d'un deal, en vérifiant que l'identifiant du deal est un nombre valide, avant de passer au middleware suivant ou au contrôleur

export const validatewalletPayload = (payload) => {
  return payload || {};
};

export function validateDealIdParam(req, res, next) {
  const dealId = Number(req.params.dealId);
  if (!dealId || isNaN(dealId)) {
    return res.status(422).json({ message: "L'identifiant du deal est invalide." });
  }
  next();
}
// Permet de valider le montant final optionnel dans la requête de paiement final d'un deal, en vérifiant que le montant est un nombre valide et supérieur à 0 si il est fourni, avant de passer au middleware suivant ou au contrôleur
export function validateOptionalFinalAmount(req, res, next) {
  if (req.body?.amount === undefined || req.body?.amount === null || req.body?.amount === "") {
    return next();
  }
  const amount = Number(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(422).json({ message: "Le montant final doit etre superieur a 0." });
  }
  next();
}
// Permet de valider les paramètres de la requête pour payer le montant total d'un deal, en vérifiant que l'identifiant du deal est un nombre valide, que le montant total et le montant de l'avance sont des nombres valides et que la date limite est une date valide, avant de passer au middleware suivant ou au contrôleur
export function validateDealTotalPayment(req, res, next) {
  const dealId = Number(req.params.dealId);
  if (!dealId || isNaN(dealId)) {
    return res.status(422).json({ message: "L'identifiant du deal est invalide." });
  }
  next();
}
