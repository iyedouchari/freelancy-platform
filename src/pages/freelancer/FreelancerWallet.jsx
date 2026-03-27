// ─── Module 4 : FreelancerWallet ─────────────────────────────────────────────
// Page wallet du freelancer : solde, retrait, commissions, historique.

import { useMemo, useState } from "react";
import { format } from "../../utils/format";
import { initialFreelancerTransactions, initialFreelancerWallet } from "../data/walletData";
import { paymentService } from "../../services/paymentService";
import { walletService } from "../../services/walletService";
import "./FreelancerWallet.css";

// ─── Config ───────────────────────────────────────────────────────────────────

const typeMeta = {
  credit:     { label: "Credit",    className: "credit",  prefix: "+" },
  debit:      { label: "Debit",     className: "debit",   prefix: "-" },
  fee:        { label: "Commission",className: "fee",     prefix: "-" },
  withdrawal: { label: "Retrait",   className: "debit",   prefix: "-" },
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

function WalletStat({ label, value, hint }) {
  return (
    <div className="freelancer-wallet-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function FreelancerWallet() {
  const [walletInfo]    = useState(initialFreelancerWallet);
  const [transactions, setTransactions] = useState(initialFreelancerTransactions);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing]     = useState(false);
  const [notification, setNotification]     = useState(null);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const available = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      if (tx.type === "credit")     return sum + tx.amount;
      if (tx.type === "fee")        return sum + tx.amount; // négatif
      if (tx.type === "withdrawal") return sum + tx.amount; // négatif
      return sum;
    }, 0);
  }, [transactions]);

  const pending = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === "credit" && tx.status === "En attente")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const showNotif = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);

    if (!amount || amount < walletInfo.minWithdrawal) {
      showNotif("error", `Le montant minimum de retrait est de ${walletInfo.minWithdrawal} DT.`);
      return;
    }

    if (!walletService.hasSufficientBalance(available, amount)) {
      showNotif("error", "Solde insuffisant pour effectuer ce retrait.");
      return;
    }

    setIsProcessing(true);
    try {
      const { transaction } = await paymentService.requestWithdrawal({
        freelancerId: walletInfo.ownerId,
        amount,
        bankAccountMasked: walletInfo.bankAccountMasked,
      });

      setTransactions((current) => walletService.applyTransaction(current, transaction));
      setWithdrawAmount("");
      showNotif("success", `Retrait de ${format(amount)} DT effectue vers ${walletInfo.bankAccountMasked}.`);
    } catch (err) {
      showNotif("error", err.message ?? "Echec du retrait. Reessayez.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    walletService.exportToCSV(transactions, "freelancer-wallet-transactions.csv");
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="freelancer-wallet-page">
      <div className="freelancer-wallet-shell">

        {/* Toast notification */}
        {notification && (
          <div className={`freelancer-wallet-toast is-${notification.type}`}>
            {notification.text}
          </div>
        )}

        {/* Header + Stats */}
        <header className="freelancer-wallet-header">
          <div className="freelancer-wallet-copy">
            <span className="freelancer-wallet-eyebrow">Portefeuille</span>
            <h1>Vos encaissements et retraits dans une page dediee</h1>
            <p>
              Suivez chaque acompte recu, chaque commission preleve et chaque
              virement bancaire depuis votre espace freelancer.
            </p>
          </div>

          <div className="freelancer-wallet-stats">
            <WalletStat
              label="Disponible"
              value={`${format(available)} DT`}
              hint="pret pour retrait"
            />
            <WalletStat
              label="En attente"
              value={`${format(pending)} DT`}
              hint="milestones non debloques"
            />
            <WalletStat
              label="Retire"
              value={`${format(walletInfo.totalWithdrawn)} DT`}
              hint="sur les 90 derniers jours"
            />
          </div>
        </header>

        {/* Solde + Retrait */}
        <div className="freelancer-wallet-panels">
          <section className="freelancer-wallet-balance-card">
            <span className="freelancer-wallet-card-label">Solde principal</span>
            <strong>{format(available)} DT</strong>
            <p>
              Votre prochain virement automatique est programme pour le{" "}
              {format(walletInfo.nextPayout, "date")}.
            </p>
            <div className="freelancer-wallet-badges">
              <span>Virement bancaire actif</span>
              <span>Verification completee</span>
            </div>
          </section>

          <section className="freelancer-wallet-payout-card">
            <h2>Effectuer un retrait</h2>

            <div className="freelancer-wallet-payout-row">
              <span>Methode</span>
              <strong>Virement bancaire</strong>
            </div>
            <div className="freelancer-wallet-payout-row">
              <span>Compte</span>
              <strong>{walletInfo.bankAccountMasked}</strong>
            </div>
            <div className="freelancer-wallet-payout-row">
              <span>Frais estimes</span>
              <strong>{walletInfo.withdrawalFee} DT</strong>
            </div>
            <div className="freelancer-wallet-payout-row">
              <span>Seuil minimum</span>
              <strong>{walletInfo.minWithdrawal} DT</strong>
            </div>

            <div className="freelancer-wallet-withdraw-row">
              <input
                type="number"
                min={walletInfo.minWithdrawal}
                placeholder={`Min. ${walletInfo.minWithdrawal} DT`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isProcessing}
                onKeyDown={(e) => e.key === "Enter" && handleWithdraw()}
              />
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isProcessing}
                className={isProcessing ? "loading" : ""}
              >
                {isProcessing ? "Traitement…" : "Retirer"}
              </button>
            </div>
          </section>
        </div>

        {/* Historique */}
        <section className="freelancer-wallet-history">
          <div className="freelancer-wallet-section-head">
            <div>
              <span className="freelancer-wallet-section-eyebrow">Historique</span>
              <h2>Mouvements recents</h2>
            </div>
            <button type="button" onClick={handleExport}>
              Exporter CSV
            </button>
          </div>

          <div className="freelancer-wallet-transaction-list">
            {transactions.map((tx) => {
              const meta = typeMeta[tx.type] ?? typeMeta.debit;
              return (
                <article key={tx.id} className="freelancer-wallet-transaction">
                  <div className="freelancer-wallet-transaction-main">
                    <span className={`freelancer-wallet-direction is-${meta.className}`}>
                      {meta.label}
                    </span>
                    <div>
                      <h3>{tx.label}</h3>
                      <p>{format(tx.date, "date")}</p>
                    </div>
                  </div>

                  <div className="freelancer-wallet-transaction-side">
                    <strong className={tx.amount > 0 ? "is-credit" : "is-debit"}>
                      {meta.prefix}{format(Math.abs(tx.amount))} DT
                    </strong>
                    <span>{tx.status}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}