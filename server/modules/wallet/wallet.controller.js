import { successResponse } from "../../utils/apiResponse.js";
import * as walletService from "./wallet.service.js";

export const getwalletStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 200,
    message: "wallet module is ready.",
  });
};

export async function getMyWallet(req, res) {
  try {
    const data = await walletService.getWalletWithTransactions(req.user.id);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

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

export async function getMyTransactions(req, res) {
  try {
    const data = await walletService.getWalletWithTransactions(req.user.id);
    return res.json({ transactions: data.transactions ?? [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

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
