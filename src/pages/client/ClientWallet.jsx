import { useEffect, useMemo, useState } from "react";
import { format } from "../../utils/format";
import { walletService } from "../../services/walletService";
import "./ClientWallet.css";


const PAYMENT_METHODS = [
  { key: "card",     label: "Carte CIB",         hint: "Paiement securise par carte CIB" },
  { key: "transfer", label: "Virement bancaire", hint: "Delai 1-2 jours ouvrables" },
  { key: "d17",      label: "D17",               hint: "Paiement mobile D17"        },
  { key: "flouci",   label: "Flouci",            hint: "Paiement mobile Flouci"     },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const filterOptions = [
  { key: "all",        label: "Toutes"          },
  { key: "topup",      label: "Recharges"       },
  { key: "advance_debit", label: "Avances payees" },
  { key: "final_debit", label: "Paiements finaux" },
  { key: "refund", label: "Retraits" },
];

const typeMeta = {
  credit:     { label: "Credit",     className: "credit", prefix: "+" },
  debit:      { label: "Paiement",   className: "debit",  prefix: "-" },
  escrow:     { label: "Séquestre",  className: "escrow", prefix: "-" },
  fee:        { label: "Frais",      className: "fee",    prefix: "-" },
  topup:      { label: "Recharge",   className: "credit", prefix: "+" },
  withdrawal: { label: "Retrait",    className: "debit",  prefix: "-" },
  refund:     { label: "Remboursement", className: "credit", prefix: "+" },
  advance_debit:  { label: "Acompte",     className: "escrow", prefix: "-" },
  advance_credit: { label: "Acompte",     className: "credit", prefix: "+" },
  final_debit:    { label: "Paiement final", className: "debit",  prefix: "-" },
  final_credit:   { label: "Paiement final", className: "credit", prefix: "+" },
};

function exportTransactions(transactions) {
  const rows = [
    ["Date", "Libelle", "Detail", "Type", "Montant", "Statut"].join(";"),
    ...transactions.map((t) =>
      [t.date, t.label, t.detail, typeMeta[t.type]?.label ?? t.type, t.amount, t.status].join(";")
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "wallet.csv"; link.click();
  URL.revokeObjectURL(url);
}

// ─── Modale Recharge ──────────────────────────────────────────────────────────
function RechargeModal({ onClose, onConfirm }) {
  const [step,           setStep]           = useState(1);
  const [method,         setMethod]         = useState("card");
  const [amount,         setAmount]         = useState("");
  const [customAmt,      setCustomAmt]      = useState("");
  const [cardNum,        setCardNum]        = useState("");
  const [cardName,       setCardName]       = useState("");
  const [cardExpiry,     setCardExpiry]     = useState("");
  const [cardCvv,        setCardCvv]        = useState("");
  const [isFlipped,      setIsFlipped]      = useState(false);
  const [loading,        setLoading]        = useState(false);

  const finalAmount    = Number(amount || customAmt);
  const selectedMethod = PAYMENT_METHODS.find((m) => m.key === method);

  function formatCardNum(val) { return val.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim(); }
  function formatExpiry(val)  { const v=val.replace(/\D/g,"").slice(0,4); return v.length>2?v.slice(0,2)+"/"+v.slice(2):v; }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await walletService.topup(finalAmount);
      setStep(4);
      onConfirm({ amount: finalAmount, methodLabel: selectedMethod?.label });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const progressSteps = ["Methode", "Montant", "Paiement"];

  return (
    <div className="rm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rm-modal">

        <div className="rm-header">
          <div className="rm-header-left">
            <div className="rm-header-icon">💳</div>
            <div>
              <h2>Recharger le portefeuille</h2>
              <p>{selectedMethod ? selectedMethod.label : "Choisissez une methode"}</p>
            </div>
          </div>
          <button className="rm-close" onClick={onClose}>×</button>
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

        {/* Step 1 — Méthode */}
        {step === 1 && (
          <div className="rm-body">
            <p className="rm-subtitle">Selectionnez votre methode de paiement</p>
            <div className="rm-methods-grid">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.key} className="rm-method-card" onClick={() => { setMethod(m.key); setStep(2); }} style={{ "--method-color": "#2a52be" }}>
                  <div className="rm-method-info"><strong>{m.label}</strong><small>{m.hint}</small></div>
                  <div className="rm-method-arrow">→</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Montant */}
        {step === 2 && (
          <div className="rm-body">

            <p className="rm-subtitle">{selectedMethod?.label} — Choisissez le montant</p>
            <div className="rm-quick-grid">
              {QUICK_AMOUNTS.map((val) => (
                <button key={val} className={`rm-quick-btn ${amount === String(val) ? "active" : ""}`} onClick={() => { setAmount(String(val)); setCustomAmt(""); }}>
                  <strong>{val}</strong><span>DT</span>
                </button>
              ))}
            </div>
            <div className="rm-divider"><span>ou saisir un montant</span></div>
            <div className="rm-input-group">
              <label>Montant personnalise (min. 10 DT)</label>
              <div className="rm-input-with-unit">
                <input type="number" min="10" placeholder="Ex: 150" value={customAmt} onChange={(e) => { setCustomAmt(e.target.value); setAmount(""); }} />
                <span className="rm-input-unit">DT</span>
              </div>
            </div>
            {finalAmount >= 10 && (
              <div className="rm-amount-summary">
                <div className="rm-amount-row"><span>Methode</span><strong>{selectedMethod?.label}</strong></div>
                <div className="rm-amount-row"><span>Montant</span><strong>{format(finalAmount)} DT</strong></div>
                <div className="rm-amount-row rm-amount-total"><span>Total credite</span><strong>{format(finalAmount)} DT</strong></div>
              </div>
            )}
            <div className="rm-actions">
              <button className="rm-btn-ghost" onClick={() => setStep(1)}>← Retour</button>
              <button className="rm-btn-primary" onClick={() => { if (finalAmount >= 10) setStep(3); }} disabled={!finalAmount || finalAmount < 10}>
                Continuer {finalAmount >= 10 ? `— ${format(finalAmount)} DT` : ""}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Paiement */}
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
            <div className="rm-input-group"><label>Numero de carte</label><input type="text" placeholder="1234 5678 9012 3456" value={cardNum} onChange={(e) => setCardNum(formatCardNum(e.target.value))} maxLength={19} autoComplete="one-time-code" inputMode="numeric" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="wltfield1" data-lpignore="true" data-1p-ignore="true" /></div>
            <div className="rm-input-group"><label>Nom du titulaire</label><input type="text" placeholder="PRENOM NOM" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} autoComplete="one-time-code" autoCorrect="off" autoCapitalize="characters" spellCheck={false} name="wltfield2" data-lpignore="true" data-1p-ignore="true" /></div>
            <div className="rm-row-2">
              <div className="rm-input-group"><label>Expiration</label><input type="text" placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} autoComplete="one-time-code" inputMode="numeric" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="wltfield3" data-lpignore="true" data-1p-ignore="true" /></div>
              <div className="rm-input-group"><label>CVV</label><input type="password" placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.slice(0,3))} maxLength={3} onFocus={() => setIsFlipped(true)} onBlur={() => setIsFlipped(false)} autoComplete="new-password" inputMode="numeric" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="wltfield4" data-lpignore="true" data-1p-ignore="true" /></div>
            </div>

            <div className="rm-actions">
              <button className="rm-btn-ghost" onClick={() => setStep(2)} disabled={loading}>← Retour</button>
              <button className={`rm-btn-primary ${loading ? "loading" : ""}`} onClick={handleConfirm} disabled={loading || !(cardNum && cardName && cardExpiry && cardCvv)}>
                {loading ? "⟳ Traitement..." : `Confirmer ${format(finalAmount)} DT`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Succès */}
        {step === 4 && (
          <div className="rm-success">
            <div className="rm-success-circle"><div className="rm-success-check">☑</div></div>
            <h3>Paiement reussi !</h3>
            <p>Votre portefeuille a ete rechargé de <strong>{format(finalAmount)} DT</strong></p>
            <div className="rm-success-method">{selectedMethod?.label}</div>
            <button className="rm-btn-primary rm-btn-full" onClick={onClose}>Fermer</button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ClientWallet() {
  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState(null);
  const [filter,       setFilter]       = useState("all");
  const [search,       setSearch]       = useState("");
  const [showModal,    setShowModal]    = useState(false);
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
      setLoadError(err?.message || "Impossible de charger le wallet.");
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
    return transactions.filter((t) => {
      const matchesFilter = filter === "all" || t.type === filter;
      const matchesQuery  = !query || (t.label?.toLowerCase().includes(query)) || (t.detail?.toLowerCase().includes(query));
      return matchesFilter && matchesQuery;
    });
  }, [filter, search, transactions]);

  const stats = useMemo(() => {
    if (wallet) {
      return {
        availableBalance: Number(wallet.balance),
        escrowLocked:     Number(wallet.locked ?? 0),
        totalPaid:        transactions.filter((t) => t.type === "advance_debit" || t.type === "final_debit").reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
      };
    }
    const availableBalance = transactions.reduce((sum, t) => {
      if (t.type === "credit" || t.type === "topup" || t.type === "refund") return sum + Number(t.amount);
      if (t.type === "debit" || t.type === "fee" || t.type === "withdrawal") return sum + Number(t.amount);
      return sum;
    }, 0);
    const escrowLocked = transactions.filter((t) => t.type === "escrow" || t.type === "advance_debit").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const totalPaid    = transactions.filter((t) => t.type === "advance_debit" || t.type === "final_debit").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    return { availableBalance, escrowLocked, totalPaid };
  }, [wallet, transactions]);

  const showNotif = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRechargeConfirm = async ({ amount }) => {
    await loadWalletData();
    showNotif(`Recharge de ${format(amount)} DT effectuee avec succes.`);
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
            <span className="client-wallet-eyebrow">Wallet client</span>
            <h1>Suivre votre solde, vos fonds bloques et les paiements projet</h1>
            <p>Ce wallet vous donne une vue claire sur les recharges, les montants places en sequestre et les paiements deja liberes sur vos collaborations.</p>
          </div>

          <div className="client-wallet-recharge-card">
            <span>Ajouter des fonds</span>
            <p className="recharge-card-hint">Choisissez votre methode de paiement et le montant a crediter sur votre wallet.</p>
            <div className="recharge-methods-preview">
            </div>
            <button type="button" className="recharge-open-btn" onClick={() => setShowModal(true)}>
              Recharger mon wallet
            </button>
          </div>
        </section>

        <section className="client-wallet-stats">
          <article>
            <span>Solde disponible</span>
            <strong>{format(stats.availableBalance)} DT</strong>
          </article>
          <article>
            <span>Fonds en sequestre</span>
            <strong>{format(stats.escrowLocked)} DT</strong>
          </article>
          <article>
            <span>Deja paye</span>
            <strong>{format(stats.totalPaid)} DT</strong>
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
                <button key={option.key} type="button" className={`client-wallet-filter ${filter === option.key ? "active" : ""}`} onClick={() => setFilter(option.key)}>
                  {option.label}
                </button>
              ))}
            </div>
            <label className="client-wallet-search">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un mouvement" />
            </label>
          </div>

          <div className="client-wallet-transaction-list">
            {filteredTransactions.length === 0 ? (
              <div className="client-wallet-empty">
                <strong>Aucun mouvement correspondant</strong>
                <p>Essayez un autre filtre ou ajoutez des fonds au portefeuille.</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const meta = typeMeta[transaction.type] ?? typeMeta.debit;
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
        <RechargeModal
          onClose={() => setShowModal(false)}
          onConfirm={handleRechargeConfirm}
        />
      )}
    </div>
  );
}
