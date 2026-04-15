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

export function validateDealTotalPayment(req, res, next) {
  const dealId = Number(req.params.dealId);
  if (!dealId || isNaN(dealId)) {
    return res.status(422).json({ message: "L'identifiant du deal est invalide." });
  }
  next();
}
