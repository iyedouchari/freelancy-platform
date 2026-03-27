// ─── Module 4 : walletService ────────────────────────────────────────────────
// Gère les comptes wallet_accounts et expose les opérations de solde.
// Conçu pour être branché sur une API REST en production.

export const walletService = {
  /**
   * Recalcule les statistiques du wallet depuis l'historique de transactions.
   * @param {Array} transactions
   * @returns {{ available, escrowLocked, totalPaid }}
   */
  computeStats(transactions) {
    const available = transactions.reduce((sum, tx) => {
      if (tx.type === "credit" || tx.type === "refund") return sum + tx.amount;
      if (tx.type === "debit" || tx.type === "fee")     return sum + tx.amount; // négatif
      return sum;
    }, 0);

    const escrowLocked = transactions
      .filter((tx) => tx.type === "escrow")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const totalPaid = transactions
      .filter((tx) => tx.type === "debit")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return { available, escrowLocked, totalPaid };
  },

  /**
   * Vérifie si le solde disponible est suffisant pour un montant donné.
   * @param {number} available  - Solde disponible actuel
   * @param {number} amount     - Montant à débiter
   * @returns {boolean}
   */
  hasSufficientBalance(available, amount) {
    return available >= amount;
  },

  /**
   * Applique une transaction au tableau existant (immutable).
   * @param {Array}  transactions  - Tableau courant
   * @param {Object} newTx         - Nouvelle transaction à prepend
   * @returns {Array}
   */
  applyTransaction(transactions, newTx) {
    return [newTx, ...transactions];
  },

  /**
   * Exporte un tableau de transactions en CSV.
   * @param {Array}  transactions
   * @param {string} filename
   */
  exportToCSV(transactions, filename = "wallet-transactions.csv") {
    const typeLabelMap = {
      credit: "Credit",
      debit: "Paiement",
      escrow: "Escrow",
      fee: "Frais",
      refund: "Remboursement",
      withdrawal: "Retrait",
    };

    const rows = [
      ["Date", "Libelle", "Detail", "Type", "Montant", "Statut"].join(";"),
      ...transactions.map((tx) =>
        [
          tx.date,
          `"${tx.label}"`,
          `"${tx.detail}"`,
          typeLabelMap[tx.type] ?? tx.type,
          tx.amount,
          tx.status,
        ].join(";")
      ),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};