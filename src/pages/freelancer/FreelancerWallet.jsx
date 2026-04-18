import { useEffect, useMemo, useState } from "react";
import { format } from "../../utils/format";
import { walletService } from "../../services/walletService";
import "../client/ClientWallet.css";

const WITHDRAW_METHODS = [
  { key: "card", label: "Carte CIB", hint: "Retrait vers votre carte CIB" },
  { key: "transfer", label: "Virement bancaire", hint: "Retrait vers votre compte bancaire" },
  { key: "d17", label: "D17", hint: "Retrait mobile D17" },
  { key: "flouci", label: "Flouci", hint: "Retrait mobile Flouci" },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

const filterOptions = [
  { key: "all", label: "Toutes" },
  { key: "advance_credit", label: "Avances recues" },
  { key: "final_credit", label: "Paiements finaux" },
  { key: "refund", label: "Retraits" },
];

const typeMeta = {
  refund: { label: "Retrait", className: "debit", prefix: "-" },
  advance_credit: { label: "Avance", className: "credit", prefix: "+" },
  final_credit: { label: "Paiement final", className: "credit", prefix: "+" },
  topup: { label: "Recharge", className: "credit", prefix: "+" },
};

function exportTransactions(transactions) {
  const rows = [
    ["Date", "Libelle", "Detail", "Type", "Montant", "Statut"].join(";"),
    ...transactions.map((t) =>
      [t.date, t.label, t.detail, typeMeta[t.type]?.label ?? t.type, t.amount, t.status].join(";"),
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "freelancer-wallet.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function WithdrawModal({ availableBalance, onClose, onConfirm }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("card");
  const [amount, setAmount] = useState("");
  const [customAmt, setCustomAmt] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const finalAmount = Number(amount || customAmt);
  const selectedMethod = WITHDRAW_METHODS.find((item) => item.key === method);
  const isValidAmount = finalAmount >= 100 && finalAmount <= availableBalance;

  function formatCardNum(val) { return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
  function formatExpiry(val)  { const v = val.replace(/\D/g, "").slice(0, 4); return v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v; }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await walletService.withdraw(finalAmount, selectedMethod?.label || "Retrait");
      setStep(4);
      onConfirm?.({ amount: finalAmount, methodLabel: selectedMethod?.label });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const progressSteps = ["Methode", "Montant", "Validation"];

  return (
    <div className="rm-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="rm-modal">
        <div className="rm-header">
          <div className="rm-header-left">
            <div className="rm-header-icon">💸</div>
            <div>
              <h2>Retirer des fonds</h2>
              <p>{selectedMethod ? selectedMethod.label : "Choisissez une methode de retrait"}</p>
            </div>
          </div>
          <button className="rm-close" onClick={onClose}>✕</button>
        </div>

        {step < 4 && (
          <div className="rm-progress">
            {progressSteps.map((s, i) => (
              <div key={s} className={`rm-progress-step ${step > i ? "done" : ""} ${step === i + 1 ? "active" : ""}`}>
                <div className="rm-progress-dot">{step > i + 1 ? "☑" : i + 1}</div>
                <span>{s}</span>
                {i < 2 && <div className={`rm-progress-line ${step > i + 1 ? "done" : ""}`} />}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="rm-body">
            <p className="rm-subtitle">Selectionnez votre methode de retrait</p>
            <div className="rm-methods-grid">
              {WITHDRAW_METHODS.map((item) => (
                <button
                  key={item.key}
                  className="rm-method-card"
                  onClick={() => {
                    setMethod(item.key);
                    setStep(2);
                  }}
                  style={{ "--method-color": "#0b5e8e" }}
                >
                  <div className="rm-method-icon">{item.icon}</div>
                  <div className="rm-method-info">
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </div>
                  <div className="rm-method-arrow">→</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rm-body">
            <p className="rm-subtitle">{selectedMethod?.icon} {selectedMethod?.label} — Choisissez le montant</p>
            <div className="rm-quick-grid">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  className={`rm-quick-btn ${amount === String(value) ? "active" : ""}`}
                  onClick={() => {
                    setAmount(String(value));
                    setCustomAmt("");
                  }}
                >
                  <strong>{value}</strong>
                  <span>DT</span>
                </button>
              ))}
            </div>
            <div className="rm-divider"><span>ou saisir un montant</span></div>
            <div className="rm-input-group">
              <label>Montant personnalise (min. 100 DT)</label>
              <div className="rm-input-with-unit">
                <input
                  type="number"
                  min="100"
                  placeholder="Ex: 350"
                  value={customAmt}
                  onChange={(event) => {
                    setCustomAmt(event.target.value);
                    setAmount("");
                  }}
                />
                <span className="rm-input-unit">DT</span>
              </div>
            </div>
            <div className="rm-amount-summary">
              <div className="rm-amount-row"><span>Solde disponible</span><strong>{format(availableBalance)} DT</strong></div>
              <div className="rm-amount-row"><span>Montant du retrait</span><strong>{format(finalAmount || 0)} DT</strong></div>
            </div>
            <div className="rm-actions">
              <button className="rm-btn-ghost" onClick={() => setStep(1)}>← Retour</button>
              <button className="rm-btn-primary" onClick={() => setStep(3)} disabled={!isValidAmount}>
                Continuer {isValidAmount ? `— ${format(finalAmount)} DT` : ""}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rm-body">
            <div className={`rm-card-preview ${isFlipped ? "flipped" : ""}`} style={{ "--card-color": "#c41e3a" }}>
              <div className="rm-card-front">
                <div className="rm-card-top">
                  <div className="rm-card-chip"><div /><div /><div /><div /></div>
                </div>
                <div className="rm-card-number">{cardNum || "•••• •••• •••• ••••"}</div>
                <div className="rm-card-bottom">
                  <div><div className="rm-card-label">Titulaire</div><div className="rm-card-val">{cardName || "VOTRE NOM"}</div></div>
                  <div><div className="rm-card-label">Expiration</div><div className="rm-card-val">{cardExpiry || "MM/AA"}</div></div>
                </div>
              </div>
              <div className="rm-card-back">
                <div className="rm-card-stripe" />
                <div className="rm-card-cvv-row">
                  <div className="rm-card-cvv-label">CVV</div>
                  <div className="rm-card-cvv-val">{cardCvv || "•••"}</div>
                </div>
              </div>
            </div>
            <div className="rm-input-group">
              <label>Numero de carte</label>
              <input type="text" placeholder="1234 5678 9012 3456" value={cardNum} onChange={(event) => setCardNum(formatCardNum(event.target.value))} maxLength={19} autoComplete="one-time-code" inputMode="numeric" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="wltfield1" data-lpignore="true" data-1p-ignore="true" />
            </div>
            <div className="rm-input-group">
              <label>Nom du titulaire</label>
              <input type="text" placeholder="PRENOM NOM" value={cardName} onChange={(event) => setCardName(event.target.value.toUpperCase())} autoComplete="one-time-code" autoCorrect="off" autoCapitalize="characters" spellCheck={false} name="wltfield2" data-lpignore="true" data-1p-ignore="true" />
            </div>
            <div className="rm-row-2">
              <div className="rm-input-group">
                <label>Expiration</label>
                <input type="text" placeholder="MM/AA" value={cardExpiry} onChange={(event) => setCardExpiry(formatExpiry(event.target.value))} maxLength={5} autoComplete="one-time-code" inputMode="numeric" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="wltfield3" data-lpignore="true" data-1p-ignore="true" />
              </div>
              <div className="rm-input-group">
                <label>CVV</label>
                <input type="password" placeholder="•••" value={cardCvv} onChange={(event) => setCardCvv(event.target.value.slice(0, 3))} maxLength={3} onFocus={() => setIsFlipped(true)} onBlur={() => setIsFlipped(false)} autoComplete="new-password" inputMode="numeric" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="wltfield4" data-lpignore="true" data-1p-ignore="true" />
              </div>
            </div>

            <div className="rm-actions">
              <button className="rm-btn-ghost" onClick={() => setStep(2)} disabled={loading}>← Retour</button>
              <button
                className={`rm-btn-primary ${loading ? "loading" : ""}`}
                onClick={handleConfirm}
                disabled={
                  loading
                  || !isValidAmount
                  || !(cardNum.trim() && cardName.trim() && cardExpiry.trim() && cardCvv.trim())
                }
              >
                {loading ? "⟳ Traitement..." : `Confirmer retrait ${format(finalAmount)} DT`}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rm-success">
            <div className="rm-success-circle"><div className="rm-success-check">☑</div></div>
            <h3>Retrait enregistre !</h3>
            <p>Votre demande de retrait de <strong>{format(finalAmount)} DT</strong> a ete prise en compte.</p>
            <div className="rm-success-method">{selectedMethod?.label}</div>
            <button className="rm-btn-primary rm-btn-full" onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FreelancerWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadWalletData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await walletService.getWallet();
      setWallet(data?.wallet ?? null);
      setTransactions(
        (Array.isArray(data?.transactions) ? data.transactions : []).sort(
          (a, b) => new Date(b.date ?? b.created_at) - new Date(a.date ?? a.created_at),
        ),
      );
    } catch (err) {
      setWallet(null);
      setTransactions([]);
      setLoadError(err?.message || "Impossible de charger le wallet freelancer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    loadWalletData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesFilter = filter === "all" || transaction.type === filter;
      const haystack = `${transaction.label || ""} ${transaction.detail || ""}`.toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [filter, search, transactions]);

  const stats = useMemo(() => {
    return {
      availableBalance: Number(wallet?.balance ?? 0),
      totalReceived: transactions
        .filter((transaction) => transaction.type === "advance_credit" || transaction.type === "final_credit")
        .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0),
      totalWithdrawn: transactions
        .filter((transaction) => transaction.type === "refund")
        .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0),
    };
  }, [wallet, transactions]);

  const showNotif = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleWithdrawConfirm = async ({ amount }) => {
    await loadWalletData();
    showNotif(`Retrait de ${format(amount)} DT enregistre avec succes.`);
  };

  if (loading) {
    return (
      <div className="client-wallet-page">
        <div className="client-wallet-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
          <p style={{ color: "#64748b", fontSize: "1rem" }}>Chargement du wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-wallet-page">
      <div className="client-wallet-shell">
        {notification && <div className="client-wallet-toast">{notification}</div>}
        {loadError && (
          <div className="client-wallet-empty" style={{ marginBottom: "16px" }}>
            <strong>Wallet indisponible</strong>
            <p>{loadError}</p>
            <button type="button" onClick={loadWalletData}>Reessayer</button>
          </div>
        )}

        <section className="client-wallet-hero">
          <div className="client-wallet-copy">
            <span className="client-wallet-eyebrow">Wallet freelancer</span>
            <h1>Suivre votre solde, vos gains et vos retraits</h1>
            <p>Le freelancer retrouve ici la meme interface wallet que le client, mais adaptee aux paiements recus et aux demandes de retrait.</p>
          </div>

          <div className="client-wallet-recharge-card">
            <span>Retirer mes fonds</span>
            <p className="recharge-card-hint">Choisissez votre methode de retrait puis le montant a transferer depuis votre wallet.</p>
            <button type="button" className="recharge-open-btn" onClick={() => setShowModal(true)}>
              Demander un retrait
            </button>
          </div>
        </section>

        <section className="client-wallet-stats">
          <article>
            <span>Solde disponible</span>
            <strong>{format(stats.availableBalance)} DT</strong>
          </article>
          <article>
            <span>Total recu</span>
            <strong>{format(stats.totalReceived)} DT</strong>
          </article>
          <article>
            <span>Deja retire</span>
            <strong>{format(stats.totalWithdrawn)} DT</strong>
          </article>
        </section>

        <section className="client-wallet-panel">
          <div className="client-wallet-panel-head">
            <div>
              <span className="client-wallet-panel-eyebrow">Historique</span>
              <h2>Mouvements du portefeuille</h2>
            </div>
            <button type="button" onClick={() => exportTransactions(filteredTransactions)}>Exporter CSV</button>
          </div>

          <div className="client-wallet-toolbar">
            <div className="client-wallet-filters">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`client-wallet-filter ${filter === option.key ? "active" : ""}`}
                  onClick={() => setFilter(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="client-wallet-search">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un mouvement"
              />
            </label>
          </div>

          <div className="client-wallet-transaction-list">
            {filteredTransactions.length === 0 ? (
              <div className="client-wallet-empty">
                <strong>Aucun mouvement correspondant</strong>
                <p>Les paiements recus et retraits apparaitront ici.</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const meta = typeMeta[transaction.type] ?? typeMeta.refund;
                return (
                  <article key={transaction.id} className="client-wallet-transaction-card">
                    <div className="client-wallet-transaction-top">
                      <div>
                        <span className={`client-wallet-badge is-${meta.className}`}>{meta.label}</span>
                        <h3>{transaction.label}</h3>
                      </div>
                      <div className="client-wallet-amount-block">
                        <strong className={`is-${meta.className}`}>
                          {meta.prefix}{format(Math.abs(Number(transaction.amount)))} DT
                        </strong>
                        <small>{transaction.status}</small>
                      </div>
                    </div>
                    <p>{transaction.detail}</p>
                    <div className="client-wallet-transaction-footer">
                      <span>{new Date(transaction.date ?? transaction.created_at).toLocaleDateString("fr-FR")}</span>
                      <span>Ref. {transaction.id}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <WithdrawModal
          availableBalance={Number(wallet?.balance ?? 0)}
          onClose={() => setShowModal(false)}
          onConfirm={handleWithdrawConfirm}
        />
      )}
    </div>
  );
}
