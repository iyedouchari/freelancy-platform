// ─── wallet.validation.js ────────────────────────────────────────────────────

export function validateTopup(req, res, next) {
  const amount = Number(req.body.amount);

  if (!req.body.amount || isNaN(amount) || amount <= 0) {
    return res.status(422).json({ message: "Le montant doit être supérieur à 0." });
  }
  if (amount > 100000) {
    return res.status(422).json({ message: "Le montant ne peut pas dépasser 100 000 DT." });
  }

  next();
}

export function validateWithdraw(req, res, next) {
  const amount = Number(req.body.amount);

  if (!req.body.amount || isNaN(amount) || amount < 100) {
    return res.status(422).json({ message: "Le montant minimum de retrait est de 100 DT." });
  }
  if (amount > 50000) {
    return res.status(422).json({ message: "Le montant ne peut pas dépasser 50 000 DT." });
  }
  if (!req.body.bankAccountMasked) {
    return res.status(422).json({ message: "Le champ 'bankAccountMasked' est requis." });
  }

  next();
}

export const validatewalletPayload = (payload) => {
  return payload || {};
};
