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
    return deal.status === "Terminé" ? ["final"] : [];
  }

  if (
    deal.status === "Soumis"
    || deal.status === "En attente paiement final"
    || deal.status === "En cours"
    || deal.status === "Actif"
    || deal.status === "Avance payé"
  ) {
    return ["final"];
  }

  return [];
}

function getPaymentLabel(option) {
  if (option === "final") return "Payer totalité";
  return "Payer solde final";
}

function getPaymentAmount(deal, option) {
  const total = parseDealTotal(deal.total);
  return Math.max(Number(deal.remainingAmount ?? 0), Math.round(total * 0.7 * 100) / 100);
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
  const [dealTab, setDealTab] = useState("active");
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

  const canceledDeals = localDeals.filter((deal) => deal.statusType === "canceled" || deal.status === "Annule");
  const completedDeals = localDeals.filter((deal) => deal.statusType === "done");
  const activeDeals = localDeals.filter(
    (deal) => deal.statusType !== "done" && deal.statusType !== "canceled",
  );
  const tabConfig = {
    active: {
      label: `Accords en cours (${activeDeals.length})`,
      title: "Accords en cours",
      eyebrow: "Collaborations en cours",
      emptyTitle: "Aucun deal en cours",
      emptyText: "Des qu'une proposition est acceptee, le deal apparaitra ici.",
      items: activeDeals,
    },
    completed: {
      label: `Terminés (${completedDeals.length})`,
      title: "Accords terminés",
      eyebrow: "Historique",
      emptyTitle: "Aucun deal termine",
      emptyText: "Les missions finalisees apparaitront ici pour consultation.",
      items: completedDeals,
    },
    canceled: {
      label: `Annulés (${canceledDeals.length})`,
      title: "Accords annulés",
      eyebrow: "Annulations",
      emptyTitle: "Aucun deal annulé",
      emptyText: "Les deals annulés apparaîtront ici.",
      items: canceledDeals,
    },
  };
  const currentTab = tabConfig[dealTab];
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
    const penaltyAmount = Number(result?.penalty?.amount || 0);
    if (penaltyAmount > 0) {
      showNotification(
        `Paiement effectue avec penalite de retard (${format(penaltyAmount)} DT). Statut: Totalité payé.`,
      );
    } else {
      showNotification(`Paiement de ${format(amount)} DT effectue avec succes. Statut: Totalité payé.`);
    }
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
        
        <section className="client-dashboard-header">
          <div className="dashboard-header-content">
            <div className="header-left">
              <h1 className="header-title">Suivez les collaborations acceptées et gérez les paiements du deal</h1>
              <p className="header-subtitle">Tu retrouves ici les propositions acceptées, le paiement final restant et l&apos;avancement de chaque collaboration.</p>
            </div>
          </div>
        </section>

        <section className="client-dashboard-panel">
          <div className="deals-tabs-wrapper">
            <div className="deals-tabs" role="tablist" aria-label="Filtres des accords client">
              {Object.entries(tabConfig).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={dealTab === key}
                  className={`deals-tab-btn${dealTab === key ? " active" : ""}`}
                  onClick={() => setDealTab(key)}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div className="deals-section-heading">
            <div>
              <h2>{currentTab.title}</h2>
            </div>
            <span>{currentTab.items.length} accord{currentTab.items.length !== 1 ? "s" : ""}</span>
          </div>

          {currentTab.items.length === 0 ? (
            <div className="client-dashboard-empty">
              <strong>{currentTab.emptyTitle}</strong>
              <p>{currentTab.emptyText}</p>
            </div>
          ) : dealTab === "active" ? (
            <div className="client-dashboard-deal-list">
              {currentTab.items.map((deal) => {
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
                            Payer totalité
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="client-dashboard-completed-grid">
              {currentTab.items.map((deal) => (
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
