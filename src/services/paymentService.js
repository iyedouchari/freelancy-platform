// ─── Module 4 : paymentService ───────────────────────────────────────────────
// Simule les appels à une API de paiement externe (Stripe dummy).
// En production : remplacer les fonctions dummy par de vrais appels fetch.

const PLATFORM_FEE_RATE = 0.05; // 5 %
const ADVANCE_RATE = 0.2; // 20 % à la signature
const FINAL_RATE = 0.8; // 80 % à la livraison

// ─── Fausse API Stripe ────────────────────────────────────────────────────────

async function stripeDummyCreatePaymentIntent({
  amount,
  currency = "tnd",
  metadata = {},
}) {
  // Simule un délai réseau de 600 ms
  await new Promise((resolve) => setTimeout(resolve, 600));

  const success = Math.random() > 0.05; // 95 % de succès

  if (!success) {
    throw new Error(
      "STRIPE_DUMMY_ERROR: Paiement refusé par la banque émettrice."
    );
  }

  return {
    id: `pi_dummy_${Date.now()}`,
    amount,
    currency,
    status: "succeeded",
    metadata,
    created: new Date().toISOString(),
  };
}

async function stripeDummyRefund({ paymentIntentId, amount }) {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    id: `re_dummy_${Date.now()}`,
    paymentIntentId,
    amount,
    status: "succeeded",
    created: new Date().toISOString(),
  };
}

// ─── Service principal ────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Calcule les montants pour un deal donné.
   * @param {number} totalAmount  - Budget total du deal en DT
   * @returns {{ advance, final, fee, netAdvance, netFinal }}
   */
  calculateAmounts(totalAmount) {
    const advance = Math.round(totalAmount * ADVANCE_RATE);
    const final = totalAmount - advance;
    const feeOnAdvance = Math.round(advance * PLATFORM_FEE_RATE);
    const feeOnFinal = Math.round(final * PLATFORM_FEE_RATE);
    return {
      advance,
      final,
      feeOnAdvance,
      feeOnFinal,
      netAdvance: advance - feeOnAdvance,
      netFinal: final - feeOnFinal,
    };
  },

  /**
   * Déclenche le paiement de l'acompte (20%) à l'activation d'un deal.
   * Appelé par le Membre 3 (Deals) quand une Proposal est acceptée.
   *
   * @param {{ dealId, dealTitle, clientId, freelancerId, totalAmount }} params
   * @returns {Promise<{ payment, walletTransaction }>}
   */
  async chargeAdvancePayment({
    dealId,
    dealTitle,
    clientId,
    freelancerId,
    totalAmount,
  }) {
    const amounts = this.calculateAmounts(totalAmount);

    const intent = await stripeDummyCreatePaymentIntent({
      amount: amounts.advance,
      currency: "tnd",
      metadata: { dealId, phase: "advance", clientId, freelancerId },
    });

    const payment = {
      id: `pay-${Date.now()}`,
      dealId,
      dealTitle,
      clientId,
      freelancerId,
      phase: "advance",
      amount: amounts.advance,
      platformFee: amounts.feeOnAdvance,
      netAmount: amounts.netAdvance,
      status: "completed",
      method: "wallet",
      stripePaymentIntentId: intent.id,
      createdAt: intent.created,
      completedAt: new Date().toISOString(),
      note: `Acompte 20% verse automatiquement a l'activation du deal`,
    };

    const walletTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      label: "Blocage fonds escrow",
      detail: `Acompte 20% — ${dealTitle}`,
      type: "escrow",
      amount: -amounts.advance,
      status: "En cours",
      dealId,
    };

    return { payment, walletTransaction };
  },

  /**
   * Libère le paiement final (80%) quand le client valide la livraison.
   * Met à jour l'état du Deal vers "completed" (à coordonner avec Membre 3).
   *
   * @param {{ paymentId, dealId, dealTitle, clientId, freelancerId, totalAmount }} params
   * @returns {Promise<{ payment, walletTransaction, dealStatusUpdate }>}
   */
  async releaseFinalPayment({
    dealId,
    dealTitle,
    clientId,
    freelancerId,
    totalAmount,
  }) {
    const amounts = this.calculateAmounts(totalAmount);

    const intent = await stripeDummyCreatePaymentIntent({
      amount: amounts.final,
      currency: "tnd",
      metadata: { dealId, phase: "final", clientId, freelancerId },
    });

    const payment = {
      id: `pay-${Date.now()}`,
      dealId,
      dealTitle,
      clientId,
      freelancerId,
      phase: "final",
      amount: amounts.final,
      platformFee: amounts.feeOnFinal,
      netAmount: amounts.netFinal,
      status: "completed",
      method: "wallet",
      stripePaymentIntentId: intent.id,
      createdAt: intent.created,
      completedAt: new Date().toISOString(),
      note: "Paiement final 80% — livraison validee par le client",
    };

    const walletTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      label: "Paiement libere",
      detail: `Solde final libere — ${dealTitle}`,
      type: "debit",
      amount: -amounts.final,
      status: "Traite",
      dealId,
    };

    // Signal pour Membre 3 : le Deal passe à "completed"
    const dealStatusUpdate = {
      dealId,
      newStatus: "completed",
      triggeredBy: "final_payment",
    };

    return { payment, walletTransaction, dealStatusUpdate };
  },

  /**
   * Recharge le wallet client via une API de paiement externe.
   * @param {{ clientId, amount, method }} params
   * @returns {Promise<{ transaction }>}
   */
  async rechargeWallet({ clientId, amount, method = "card" }) {
    if (!amount || amount <= 0) {
      throw new Error("Le montant de recharge doit etre superieur a 0.");
    }

    await stripeDummyCreatePaymentIntent({
      amount,
      currency: "tnd",
      metadata: { clientId, purpose: "wallet_recharge", method },
    });

    const transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      label: "Recharge portefeuille",
      detail: `Recharge via ${
        method === "card" ? "carte bancaire" : "virement"
      }`,
      type: "credit",
      amount,
      status: "Traite",
      dealId: null,
    };

    return { transaction };
  },

  /**
   * Demande de retrait pour le freelancer.
   * @param {{ freelancerId, amount, bankAccountMasked }} params
   * @returns {Promise<{ transaction }>}
   */
  async requestWithdrawal({ freelancerId, amount, bankAccountMasked }) {
    if (!amount || amount < 100) {
      throw new Error("Le montant minimum de retrait est de 100 DT.");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const transaction = {
      id: `ftx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      label: "Retrait vers compte bancaire",
      detail: `Virement vers ${bankAccountMasked}`,
      type: "withdrawal",
      amount: -amount,
      status: "Traite",
      dealId: null,
    };

    return { transaction };
  },

  /**
   * Rembourse un paiement (ex : annulation de deal).
   * @param {{ paymentIntentId, amount, dealId, dealTitle }} params
   * @returns {Promise<{ refund, transaction }>}
   */
  async refundPayment({ paymentIntentId, amount, dealId, dealTitle }) {
    const refund = await stripeDummyRefund({ paymentIntentId, amount });

    const transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      label: "Remboursement",
      detail: `Remboursement — ${dealTitle}`,
      type: "refund",
      amount,
      status: "Traite",
      dealId,
    };

    return { refund, transaction };
  },
};
