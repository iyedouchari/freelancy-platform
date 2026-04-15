import { useEffect, useState } from "react";
import { dealService, toUiDeal } from "../../services/dealService";
import { walletService } from "../../services/walletService";
import { format } from "../../utils/format";
import "../../components/PaymentModal.css";
import "./ClientDashboard.css";

function parseDealTotal(value) {
  return Number(String(value).replace(/\s/g, "").replace(",", ".")) || 0;
}

function getAvailablePaymentOptions(deal) {
  if (deal.finalPaid || deal.status === "Totalité payé" || deal.status === "Terminé") {
    return [];
  }

  if (deal.statusType === "progress" || deal.status === "En cours") {
    return ["final"];
  }

  return [];
}

function getPaymentLabel(option) {
  if (option === "final") return "Payer";
  return "Payer solde final";
}

function getPaymentAmount(deal, option) {
  const total = parseDealTotal(deal.total);
  return Math.max(Number(deal.remainingAmount ?? 0), Math.round(total * 0.7 * 100) / 100);
}

function getPaymentInfo(deal, option) {
  if (option === "final") {
    return "Le client paie maintenant le montant final restant. Le statut deviendra Totalité payé.";
  }
  return "Le paiement final libere le solde restant du deal.";
}

function PaymentModal({ deal, walletBalance, onClose, onGoToWallet, onSuccess }) {
  const options = getAvailablePaymentOptions(deal);
  const [selectedOption, setSelectedOption] = useState(options[0] ?? "final");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const amount = getPaymentAmount(deal, selectedOption);
  const hasSufficientFunds = walletBalance >= amount;

  const handleConfirm = async () => {
    if (!selectedOption) return;
    setLoading(true);
    setError("");

    try {
      await onSuccess?.({
        deal,
        paymentType: selectedOption,
        amount,
      });
    } catch (err) {
      setError(err?.message || "Le paiement a echoue.");
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="payment-modal">
        <div className="payment-modal-head">
          <div>
            <h2>Paiement du deal</h2>
            <p className="payment-modal-deal-title">{deal.title}</p>
          </div>
          <button type="button" className="payment-modal-close" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="payment-modal-body">
          {options.length > 1 && (
            <div className="client-dashboard-payment-choice">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`client-dashboard-choice-btn ${selectedOption === option ? "active" : ""}`}
                  onClick={() => setSelectedOption(option)}
                >
                  {getPaymentLabel(option)}
                </button>
              ))}
            </div>
          )}

          <div className="payment-modal-breakdown">
            <div className="payment-modal-row">
              <span>Montant total</span>
              <strong>{deal.total} DT</strong>
            </div>
            <div className="payment-modal-row">
              <span>Action</span>
              <strong>{getPaymentLabel(selectedOption)}</strong>
            </div>
            <div className="payment-modal-row is-total">
              <span>A payer maintenant</span>
              <strong>{format(amount)} DT</strong>
            </div>
          </div>

          <p className="payment-modal-info">{getPaymentInfo(deal, selectedOption)}</p>

          <div className="client-dashboard-wallet-inline">
            <span>Solde wallet disponible</span>
            <strong className={hasSufficientFunds ? "is-ok" : "is-low"}>
              {format(walletBalance)} DT
            </strong>
          </div>

          {!hasSufficientFunds && (
            <div className="payment-modal-error">
              Solde insuffisant. Recharge ton wallet puis reviens au paiement final.
            </div>
          )}

          {error && <div className="payment-modal-error">{error}</div>}

          <div className="payment-modal-actions">
            {!hasSufficientFunds ? (
              <>
                <button type="button" className="payment-modal-cancel" onClick={onClose}>
                  Fermer
                </button>
                <button type="button" className="payment-modal-confirm" onClick={onGoToWallet}>
                  Aller au wallet
                </button>
              </>
            ) : (
              <>
                <button type="button" className="payment-modal-cancel" onClick={onClose} disabled={loading}>
                  Annuler
                </button>
                <button
                  type="button"
                  className={`payment-modal-confirm ${loading ? "loading" : ""}`}
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? "Traitement..." : `${getPaymentLabel(selectedOption)} ${format(amount)} DT`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard({
  deals,
  pendingRequestsCount,
  onOpenWorkspace,
  onDealUpdate,
  onGoToWallet,
}) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [paymentDeal, setPaymentDeal] = useState(null);
  const [notification, setNotification] = useState("");
  const [localDeals, setLocalDeals] = useState(deals);

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  useEffect(() => {
    let isMounted = true;

    const loadWallet = async () => {
      setWalletLoading(true);
      setWalletError("");
      try {
        const data = await walletService.getWallet();
        if (!isMounted) return;
        setWalletBalance(Number(data?.wallet?.balance ?? 0));
      } catch (error) {
        if (!isMounted) return;
        setWalletBalance(0);
        setWalletError(error?.message || "Impossible de charger le wallet.");
      } finally {
        if (isMounted) {
          setWalletLoading(false);
        }
      }
    };

    loadWallet();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeDeals = localDeals.filter((deal) => deal.daysLeft !== null);
  const completedDeals = localDeals.filter((deal) => deal.daysLeft === null);
  const committedBudget = localDeals.reduce((sum, deal) => sum + parseDealTotal(deal.total), 0);

  const showNotification = (message) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 3500);
  };

  const handlePaymentSuccess = async ({ deal, paymentType, amount }) => {
    let result;

    result = await walletService.payFinal(deal.id, amount);

    const updatedDeal = result?.deal ? toUiDeal(result.deal) : null;

    if (!updatedDeal) {
      const refreshedDeals = await dealService.listMine();
      const fallbackDeal = refreshedDeals.find((item) => item.id === deal.id) ?? deal;
      setLocalDeals(refreshedDeals);
      setPaymentDeal(null);
      showNotification(`Paiement de ${format(amount)} DT effectue avec succes.`);
      onDealUpdate?.({
        dealId: fallbackDeal.id,
        newStatus: "fully_paid",
      });
      return;
    }

    const walletData = await walletService.getWallet();
    setWalletBalance(Number(walletData?.wallet?.balance ?? 0));
    setWalletError("");

    setLocalDeals((current) =>
      current.map((item) => (item.id === deal.id ? updatedDeal : item)),
    );

    setPaymentDeal(null);
    showNotification(`Paiement de ${format(amount)} DT effectue avec succes.`);
    onDealUpdate?.({
      dealId: updatedDeal.id,
      newStatus: "fully_paid",
      updatedDeal,
    });
  };

  return (
    <div className="client-dashboard-page">
      <div className="client-dashboard-shell">
        {notification && <div className="client-dashboard-toast">{notification}</div>}
        {walletError && <div className="client-dashboard-toast is-error">{walletError}</div>}
        <section className="client-dashboard-hero">
          <div className="client-dashboard-copy">
            <span className="client-dashboard-eyebrow">Tableau de bord client</span>
            <h1>Suivez les collaborations acceptees et gerez les paiements du deal</h1>
            <p>
              Tu retrouves ici les deals acceptes, le paiement final restant et l&apos;avancement
              de chaque collaboration.
            </p>
            <p className="client-dashboard-note">
              Apres paiement de l&apos;avance, le deal passe en cours. Ensuite, le bouton Payer ouvre
              l&apos;interface du paiement final.
            </p>
          </div>

          <div className="client-dashboard-stat-grid">
            <div className="client-dashboard-stat-card">
              <span>Deals en cours</span>
              <strong>{activeDeals.length}</strong>
              <small>collaborations deja lancees</small>
            </div>
            <div className="client-dashboard-stat-card">
              <span>Deals termines</span>
              <strong>{completedDeals.length}</strong>
              <small>missions finalisees</small>
            </div>
            <div className="client-dashboard-stat-card">
              <span>Budget engage</span>
              <strong>{format(committedBudget)} DT</strong>
              <small>sur les accords acceptes</small>
            </div>
            <div className="client-dashboard-stat-card accent">
              <span>Solde wallet</span>
              <strong>{walletLoading ? "Chargement..." : `${format(walletBalance)} DT`}</strong>
              <small>disponible pour les paiements</small>
            </div>
          </div>
        </section>

        <section className="client-dashboard-panel">
          <div className="client-dashboard-panel-head">
            <div>
              <span className="client-dashboard-panel-eyebrow">Collaborations en cours</span>
              <h2>Deals acceptes deja au travail</h2>
            </div>
          </div>

          {activeDeals.length === 0 ? (
            <div className="client-dashboard-empty">
              <strong>Aucun deal en cours</strong>
              <p>Des qu&apos;une proposition est acceptee, le deal apparaitra ici.</p>
            </div>
          ) : (
            <div className="client-dashboard-deal-list">
              {activeDeals.map((deal) => {
                const paymentOptions = getAvailablePaymentOptions(deal);

                return (
                  <article key={deal.id} className="client-dashboard-deal-card">
                    <div className="client-dashboard-deal-copy">
                      <div className="client-dashboard-deal-topline">
                        <span>{deal.freelancer}</span>
                        <strong>{deal.status}</strong>
                      </div>
                      <h3>{deal.title}</h3>
                      <p>{deal.progressLabel}</p>
                      {deal.paymentNote && (
                        <div className="client-dashboard-payment-note">
                          {deal.paymentNote}
                        </div>
                      )}
                    </div>

                    <div className="client-dashboard-deal-meta">
                      <div>
                        <span>Montant</span>
                        <strong>{deal.total} DT</strong>
                      </div>
                      <div>
                        <span>Reste a payer</span>
                        <strong>{format(Number(deal.remainingAmount ?? 0))} DT</strong>
                      </div>
                      <div>
                        <span>Echeance</span>
                        <strong>{deal.deadline}</strong>
                      </div>

                      <div className="client-dashboard-deal-actions">
                        <button type="button" className="cdb-btn-workspace" onClick={() => onOpenWorkspace?.(deal)}>
                          Espace de travail
                        </button>

                        {paymentOptions.length > 0 && (
                          <button
                            type="button"
                            className="cdb-btn-pay"
                            onClick={() => setPaymentDeal(deal)}
                          >
                            Payer
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="client-dashboard-panel">
          <div className="client-dashboard-panel-head">
            <div>
              <span className="client-dashboard-panel-eyebrow">Historique</span>
              <h2>Deals termines et deja livres</h2>
            </div>
          </div>

          {completedDeals.length === 0 ? (
            <div className="client-dashboard-empty">
              <strong>Aucun deal termine</strong>
              <p>Les missions finalisees apparaitront ici pour consultation.</p>
            </div>
          ) : (
            <div className="client-dashboard-completed-grid">
              {completedDeals.map((deal) => (
                <article key={deal.id} className="client-dashboard-completed-card">
                  <div>
                    <span>{deal.freelancer}</span>
                    <h3>{deal.title}</h3>
                    <p>{deal.paymentNote || deal.progressLabel}</p>
                  </div>
                  <div className="client-dashboard-completed-meta">
                    <strong>{deal.total} DT</strong>
                    <small>{deal.deadline}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {paymentDeal && (
        <PaymentModal
          deal={paymentDeal}
          walletBalance={walletBalance}
          onClose={() => setPaymentDeal(null)}
          onGoToWallet={() => {
            setPaymentDeal(null);
            onGoToWallet?.();
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
