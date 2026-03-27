// ─── Module 4 : ClientWallet ─────────────────────────────────────────────────
// Page wallet du client : recharge, escrow, historique, export CSV.
// Se connecte à paymentService pour les recharges (fausse API Stripe).

import { useMemo, useState } from "react";
import { format } from "../../utils/format";
import { initialClientTransactions, initialClientWallet } from "../../data/walletData";
import { paymentService } from "../../services/paymentService";
import { walletService } from "../../services/walletService";
import "./ClientWallet.css";

// ─── Config affichage ─────────────────────────────────────────────────────────

const filterOptions = [
  { key: "all",        label: "Toutes" },
  { key: "credit",     label: "Credits" },
  { key: "debit",      label: "Debits" },
  { key: "escrow",     label: "Escrow" },
  { key: "refund",     label: "Remboursements" },
  { key: "fee",        label: "Frais" },
];

const typeMeta = {
  credit:    { label: "Credit",         className: "credit",  prefix: "+" },
  debit:     { label: "Paiement",       className: "debit",   prefix: "-" },
  escrow:    { label: "Escrow",         className: "escrow",  prefix: "-" },
  fee:       { label: "Frais",          className: "fee",     prefix: "-" },
  refund:    { label: "Remboursement",  className: "credit",  prefix: "+" },
  withdrawal:{ label: "Retrait",        className: "debit",   prefix: "-" },
};

const RECHARGE_METHODS = [
  { key: "card",     label: "Carte bancaire" },
  { key: "transfer", label: "Virement bancaire" },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ClientWallet() {
  const [transactions, setTransactions] = useState(initialClientTransactions);
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeMethod, setRechargeMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', text }

  // ─── Stats dynamiques ──────────────────────────────────────────────────────
  const stats = useMemo(() => walletService.computeStats(transactions), [transactions]);

  // ─── Transactions filtrées ─────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchFilter = filter === "all" || tx.type === filter;
      const matchSearch =
        !query ||
        tx.label.toLowerCase().includes(query) ||
        tx.detail.toLowerCase().includes(query);
      return matchFilter && matchSearch;
    });
  }, [filter, search, transactions]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const showNotif = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRecharge = async () => {
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      showNotif("error", "Veuillez saisir un montant valide.");
      return;
    }

    setIsProcessing(true);
    try {
      const { transaction } = await paymentService.rechargeWallet({
        clientId: initialClientWallet.ownerId,
        amount,
        method: rechargeMethod,
      });

      setTransactions((current) => walletService.applyTransaction(current, transaction));
      setRechargeAmount("");
      showNotif("success", `Recharge de ${format(amount)} DT effectuee avec succes.`);
    } catch (err) {
      showNotif("error", err.message ?? "Echec de la recharge. Reessayez.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    walletService.exportToCSV(filteredTransactions, "client-wallet-transactions.csv");
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="client-wallet-page">
      <div className="client-wallet-shell">

        {/* Notification toast */}
        {notification && (
          <div className={`client-wallet-toast is-${notification.type}`}>
            {notification.text}
          </div>
        )}

        {/* Hero + recharge */}
        <section className="client-wallet-hero">
          <div className="client-wallet-copy">
            <span className="client-wallet-eyebrow">Wallet client</span>
            <h1>Suivre votre solde, vos fonds bloques et les paiements projet</h1>
            <p>
              Ce wallet vous donne une vue claire sur les recharges, les montants
              places en escrow et les paiements deja liberes sur vos collaborations.
            </p>
          </div>

          <div className="client-wallet-recharge-card">
            <span>Ajouter des fonds</span>

            <div className="client-wallet-recharge-method">
              {RECHARGE_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`client-wallet-method-btn ${rechargeMethod === m.key ? "active" : ""}`}
                  onClick={() => setRechargeMethod(m.key)}
                  disabled={isProcessing}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="client-wallet-recharge-row">
              <input
                type="number"
                min="1"
                placeholder="Montant en DT"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                disabled={isProcessing}
                onKeyDown={(e) => e.key === "Enter" && handleRecharge()}
              />
              <button
                type="button"
                onClick={handleRecharge}
                disabled={isProcessing}
                className={isProcessing ? "loading" : ""}
              >
                {isProcessing ? "Traitement…" : "Recharger"}
              </button>
            </div>
            <small>
              Les fonds sont credites apres confirmation de paiement (simulation Stripe).
            </small>
          </div>
        </section>

        {/* Statistiques */}
        <section className="client-wallet-stats">
          <article>
            <span>Solde disponible</span>
            <strong>{format(stats.available)} DT</strong>
          </article>
          <article>
            <span>Fonds en escrow</span>
            <strong>{format(stats.escrowLocked)} DT</strong>
            <small>Bloques jusqu'a livraison</small>
          </article>
          <article>
            <span>Deja paye</span>
            <strong>{format(stats.totalPaid)} DT</strong>
          </article>
        </section>

        {/* Historique */}
        <section className="client-wallet-panel">
          <div className="client-wallet-panel-head">
            <div>
              <span className="client-wallet-panel-eyebrow">Historique</span>
              <h2>Mouvements du portefeuille</h2>
            </div>
            <button type="button" onClick={handleExport}>
              Exporter CSV
            </button>
          </div>

          <div className="client-wallet-toolbar">
            <div className="client-wallet-filters">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`client-wallet-filter ${filter === opt.key ? "active" : ""}`}
                  onClick={() => setFilter(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="client-wallet-search">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un mouvement"
              />
            </label>
          </div>

          <div className="client-wallet-transaction-list">
            {filteredTransactions.length === 0 ? (
              <div className="client-wallet-empty">
                <strong>Aucun mouvement correspondant</strong>
                <p>Essayez un autre filtre ou ajoutez des fonds au portefeuille.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const meta = typeMeta[tx.type] ?? typeMeta.debit;
                return (
                  <article key={tx.id} className="client-wallet-transaction-card">
                    <div className="client-wallet-transaction-top">
                      <div>
                        <span className={`client-wallet-badge is-${meta.className}`}>
                          {meta.label}
                        </span>
                        <h3>{tx.label}</h3>
                      </div>
                      <div className="client-wallet-amount-block">
                        <strong className={`is-${meta.className}`}>
                          {meta.prefix}{format(Math.abs(tx.amount))} DT
                        </strong>
                        <small>{tx.status}</small>
                      </div>
                    </div>

                    <p>{tx.detail}</p>

                    <div className="client-wallet-transaction-footer">
                      <span>{new Date(tx.date).toLocaleDateString("fr-FR")}</span>
                      <span>Ref. {tx.id}</span>
                      {tx.dealId && (
                        <span className="client-wallet-deal-ref">Deal #{tx.dealId}</span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}