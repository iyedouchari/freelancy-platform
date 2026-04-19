import { successResponse } from "../../utils/apiResponse.js";
import * as walletService from "./wallet.service.js";

export const getwalletStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 200,
    message: "wallet module is ready.",
  });
};
// Permet de récupérer les informations du portefeuille de l'utilisateur connecté, y compris le solde actuel et la liste des transactions associées, en utilisant la logique métier définie dans le service et en retournant les données formatées avec un message de succès
export async function getMyWallet(req, res) {
  try {
    const data = await walletService.getWalletWithTransactions(req.user.id);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// Permet de recharger le portefeuille de l'utilisateur connecté en utilisant la logique métier définie dans le service, en fournissant le montant à recharger, et en retournant les informations de la transaction de recharge avec un message de succès
export async function topupWallet(req, res) {
  try {
    const amount = Number(req.body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Montant invalide." });
    }

    const result = await walletService.topupWallet({
      userId: req.user.id,
      amount,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
// Permet de retirer des fonds du portefeuille de l'utilisateur connecté en utilisant la logique métier définie dans le service, en fournissant le montant à retirer et les informations de compte bancaire, et en retournant les informations de la transaction de retrait avec un message de succès
export async function withdrawWallet(req, res) {
  try {
    const amount = Number(req.body.amount);
    const { bankAccountMasked } = req.body;

    if (!amount || isNaN(amount) || amount < 100) {
      return res.status(400).json({ message: "Montant minimum de retrait : 100 DT." });
    }

    const result = await walletService.withdrawWallet({
      userId: req.user.id,
      amount,
      bankAccountMasked,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
// Permet de récupérer la liste des transactions du portefeuille de l'utilisateur connecté, en utilisant la logique métier définie dans le service pour interagir avec la base de données, et en retournant les transactions formatées avec un message de succès
export async function getMyTransactions(req, res) {
  try {
    const data = await walletService.getWalletWithTransactions(req.user.id);
    return res.json({ transactions: data.transactions ?? [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// Permet de récupérer le résumé des paiements d'un deal spécifique, en vérifiant que l'utilisateur connecté est bien le client du deal, et en utilisant la logique métier définie dans le service pour calculer les montants totaux payés et restants, puis en retournant les informations formatées avec un message de succès
export async function getDealPaymentSummary(req, res) {
  try {
    const dealId = Number(req.params.dealId);
    const summary = await walletService.getDealPaymentSummary({
      dealId,
      clientId: req.user.id,
    });
    return res.json(summary);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
// Permet de payer une avance sur un deal spécifique, en vérifiant que l'utilisateur connecté est bien le client du deal, et en utilisant la logique métier définie dans le service pour effectuer le paiement de l'avance, puis en retournant les informations de la transaction de paiement avec un message de succès
export async function payDealAdvance(req, res) {
  try {
    const dealId = Number(req.params.dealId);
    const result = await walletService.payDealAdvance({
      dealId,
      clientId: req.user.id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
// Permet de payer le montant final d'un deal spécifique, en vérifiant que l'utilisateur connecté est bien le client du deal, et en utilisant la logique métier définie dans le service pour effectuer le paiement final, puis en retournant les informations de la transaction de paiement avec un message de succès ou d'erreur selon le cas
export async function payDealFinal(req, res) {
  try {
    const dealId = Number(req.params.dealId);
    const amount = req.body?.amount ? Number(req.body.amount) : null;
    const result = await walletService.payDealFinal({
      dealId,
      clientId: req.user.id,
      amount,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
// Permet de payer le montant total d'un deal spécifique, en vérifiant que l'utilisateur connecté est bien le client du deal, et en utilisant la logique métier définie dans le service pour effectuer le paiement total, puis en retournant les informations de la transaction de paiement avec un message de succès ou d'erreur selon le cas
export async function payDealTotal(req, res) {
  try {
    const dealId = Number(req.params.dealId);
    const result = await walletService.payDealTotal({
      dealId,
      clientId: req.user.id,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
