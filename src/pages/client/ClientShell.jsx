import { useEffect, useMemo, useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import {
  getFreelancerProfileById,
  initialFreelancerFeedbackById,
} from "../../data/clientData";
import ClientDashboard from "./ClientDashboard";
import ClientFreelancerProfile from "./ClientFreelancerProfile";
import ClientRequests from "./ClientRequests";
import ClientWallet from "./ClientWallet";
import FreelancerProfile from "../freelancer/FreelancerProfile";
import Workspace from "../shared/Workspace";
import { dealService, toUiDeal } from "../../services/dealService";
import { requestService } from "../../services/requestService";
import { walletService } from "../../services/walletService";
import socket from "../../services/socket.js";
import "../../components/PaymentModal.css";

const FEEDBACK_STORAGE_KEY = "client_feedback_directory";
const CLIENT_PAGE_KEY = "client_active_page";
const CLIENT_DEAL_KEY = "client_selected_deal_id";
const CLIENT_DEALS_STORAGE_KEY = "client_deals_state";
const CLIENT_REQUESTS_STORAGE_KEY = "client_requests_state";

const clientNavItems = [
  { key: "dashboard", label: "Tableau de bord", actionProp: "onDashboard" },
  { key: "requests", label: "Demandes", actionProp: "onRequests" },
  { key: "wallet", label: "Portefeuille", actionProp: "onWallet" },
];

function resolveClientName() {
  return localStorage.getItem("client_name") || "Iyed";
}

function getInitialDeal() {
  return null;
}

function loadPersistedList(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveInitialClientPage(hasDeal) {
  const persistedPage = localStorage.getItem(CLIENT_PAGE_KEY);
  if (persistedPage) {
    return persistedPage;
  }

  const requestedPage = localStorage.getItem("client_entry_page");
  localStorage.removeItem("client_entry_page");

  if (requestedPage === "workspace" && hasDeal) {
    return "workspace";
  }

  return "dashboard";
}

function loadFeedbackDirectory() {
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!stored) {
      return initialFreelancerFeedbackById;
    }

    return { ...initialFreelancerFeedbackById, ...JSON.parse(stored) };
  } catch {
    return initialFreelancerFeedbackById;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function AdvancePaymentModal({ deal, proposal, onClose, onSuccess, onGoToWallet }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadWallet = async () => {
      setLoadingWallet(true);
      try {
        const data = await walletService.getWallet();
        if (!mounted) return;
        setWalletBalance(Number(data?.wallet?.balance ?? 0));
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError?.message || "Impossible de charger le wallet.");
      } finally {
        if (mounted) {
          setLoadingWallet(false);
        }
      }
    };

    loadWallet();
    return () => {
      mounted = false;
    };
  }, []);

  const total = deal ? Number(deal.total || 0) : Number(proposal?.rate || 0);
  const advanceAmount = deal ? Number(deal.advanceAmount || 0) : Number((total * 0.3).toFixed(2));
  const hasFunds = walletBalance >= advanceAmount;
  const displayTitle = deal ? deal.title : proposal?.title;

  const handlePayAdvance = async () => {
    setSubmitting(true);
    setError("");

    try {
      if (deal) {
        const result = await walletService.payAdvance(deal.id);
        await onSuccess?.(result);
      } else if (proposal) {
        // New flow: Accept and pay in one go
        const result = await requestService.acceptAndPayProposal(proposal.id);
        await onSuccess?.(result);
      }
    } catch (paymentError) {
      setError(paymentError?.message || "Le paiement de l'avance a echoue.");
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="payment-modal">
        <div className="payment-modal-head">
          <div>
            <h2>Payer l&apos;avance</h2>
            <p className="payment-modal-deal-title">{displayTitle}</p>
          </div>
          <button type="button" className="payment-modal-close" onClick={onClose} disabled={submitting}>
            Fermer
          </button>
        </div>

        <div className="payment-modal-body">
          <div className="payment-modal-breakdown">
            <div className="payment-modal-row">
              <span>Montant total</span>
              <strong>{total} DT</strong>
            </div>
            <div className="payment-modal-row">
              <span>Avance obligatoire</span>
              <strong>{formatMoney(advanceAmount)} DT</strong>
            </div>
            <div className="payment-modal-row is-total">
              <span>A payer maintenant</span>
              <strong>{formatMoney(advanceAmount)} DT</strong>
            </div>
          </div>

          <p className="payment-modal-info">
            {proposal ? "La proposition ne sera acceptée et le deal ne commencera qu'après le paiement de l'avance. Une fois payée, le deal passe à l'état En cours." : "Le deal ne commence qu'après le paiement de l'avance. Une fois payée, le deal passe à l'état En cours."}
          </p>

          <div className="client-dashboard-wallet-inline">
            <span>Solde wallet disponible</span>
            <strong className={!loadingWallet && hasFunds ? "is-ok" : "is-low"}>
              {loadingWallet ? "Chargement..." : `${formatMoney(walletBalance)} DT`}
            </strong>
          </div>

          {!loadingWallet && !hasFunds ? (
            <div className="payment-modal-error">
              Solde insuffisant. Recharge ton wallet pour payer l&apos;avance.
            </div>
          ) : null}

          {error ? <div className="payment-modal-error">{error}</div> : null}

          <div className="payment-modal-actions">
            {!loadingWallet && !hasFunds ? (
              <>
                <button type="button" className="payment-modal-cancel" onClick={onClose} disabled={submitting}>
                  Fermer
                </button>
                <button type="button" className="payment-modal-confirm" onClick={onGoToWallet}>
                  Aller au wallet
                </button>
              </>
            ) : (
              <>
                <button type="button" className="payment-modal-cancel" onClick={onClose} disabled={submitting}>
                  Annuler
                </button>
                <button
                  type="button"
                  className={`payment-modal-confirm ${submitting ? "loading" : ""}`}
                  onClick={handlePayAdvance}
                  disabled={submitting || loadingWallet}
                >
                  {submitting ? "Traitement..." : `Payer avance ${formatMoney(advanceAmount)} DT`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientShell() {
  const initialDeal = getInitialDeal();
  const [page, setPage] = useState(() => resolveInitialClientPage(Boolean(initialDeal)));
  const [requests, setRequests] = useState(() => loadPersistedList(CLIENT_REQUESTS_STORAGE_KEY));
  const [deals, setDeals] = useState(() => loadPersistedList(CLIENT_DEALS_STORAGE_KEY));
  const [selectedDeal, setSelectedDeal] = useState(initialDeal);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(null);
  const [pendingAdvanceDeal, setPendingAdvanceDeal] = useState(null);
  const [proposalToAccept, setProposalToAccept] = useState(null);
  const [feedbackDirectory, setFeedbackDirectory] = useState(loadFeedbackDirectory);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [requestsError, setRequestsError] = useState("");

  useEffect(() => {
    localStorage.setItem(CLIENT_PAGE_KEY, page);
  }, [page]);

  useEffect(() => {
    if (!selectedDeal?.id) {
      localStorage.removeItem(CLIENT_DEAL_KEY);
      return;
    }

    localStorage.setItem(CLIENT_DEAL_KEY, String(selectedDeal.id));
  }, [selectedDeal]);

  useEffect(() => {
    localStorage.setItem(CLIENT_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(CLIENT_DEALS_STORAGE_KEY, JSON.stringify(deals));
  }, [deals]);

  const clientName = useMemo(() => resolveClientName(), []);
  const openRequests = useMemo(
    () => requests.filter((request) => request.status === "Ouverte"),
    [requests],
  );
  const activeDealsCount = deals.filter((deal) => deal.daysLeft !== null).length;
  const completedDealsCount = deals.filter((deal) => deal.daysLeft === null).length;
  const selectedFreelancerProfile = selectedFreelancerId
    ? getFreelancerProfileById(selectedFreelancerId)
    : null;

  const loadDealsWithRetry = async (matcher = null) => {
    let latestDeals = [];

    for (let attempt = 0; attempt < 3; attempt += 1) {
      latestDeals = await dealService.listMine();
      if (!matcher || latestDeals.some(matcher)) {
        return latestDeals;
      }
      await wait(250);
    }

    return latestDeals;
  };

  useEffect(() => {
    let isMounted = true;

    const loadClientData = async () => {
      setIsLoadingData(true);
      setRequestsError("");

      try {
        const [requestRows, dealRows] = await Promise.all([
          requestService.listMine(),
          loadDealsWithRetry(),
        ]);

        if (!isMounted) {
          return;
        }

        setRequests(requestRows);
        setDeals(dealRows);
        setSelectedDeal((current) => {
          if (current?.id) {
            return current;
          }

          const persistedDealId = localStorage.getItem(CLIENT_DEAL_KEY);
          if (persistedDealId) {
            return dealRows.find((deal) => String(deal.id) === persistedDealId) ?? dealRows[0] ?? null;
          }

          return dealRows[0] ?? null;
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRequestsError(error.message || "Impossible de charger les donnees client.");
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    loadClientData();

    return () => {
      isMounted = false;
    };
  }, []);

  const openWorkspace = (dealOrId) => {
    const resolvedDeal =
      typeof dealOrId === "object"
        ? dealOrId
        : deals.find((deal) => deal.id === dealOrId) ?? deals[0] ?? null;

    if (!resolvedDeal) {
      return;
    }

    setSelectedDeal(resolvedDeal);
    setPage("workspace");
  };

  const openFreelancerProfile = (freelancerId) => {
    setSelectedFreelancerId(freelancerId);
    setPage("freelancerProfile");
  };

  const handleCreateRequest = async (payload) => {
    const createdRequest = await requestService.create(payload);
    setRequests((current) => [createdRequest, ...current]);
    return createdRequest;
  };

  const handleUpdateRequest = async (requestId, payload) => {
    const updatedRequest = await requestService.update(requestId, payload);
    setRequests((current) =>
      current.map((item) => (item.id === requestId ? updatedRequest : item)),
    );
    return updatedRequest;
  };

  const handleDeleteRequest = async (requestId) => {
    await requestService.remove(requestId);
    setRequests((current) => current.filter((item) => item.id !== requestId));
    return true;
  };

  const handleAcceptProposal = (requestId, proposalId) => {
    const request = requests.find((item) => item.id === requestId);
    const proposal = request?.proposals.find((item) => item.id === proposalId);

    if (proposal) {
      setProposalToAccept(proposal);
    }
  };

  const handleAcceptAndPaySuccess = async (result) => {
    const createdDeal = result?.deal ? toUiDeal(result.deal) : null;
    
    // Refresh data
    const [nextRequests, nextDeals] = await Promise.all([
      requestService.listMine(),
      loadDealsWithRetry((deal) => deal.id === createdDeal?.id),
    ]);

    setRequests(nextRequests);
    setDeals(nextDeals);

    if (createdDeal) {
      setSelectedDeal(createdDeal);
      setPage("workspace");
    } else {
      setPage("dashboard");
    }
    
    setProposalToAccept(null);
  };
  const handleAdvancePaymentSuccess = async (result) => {
    const updatedDeal = result?.deal ? toUiDeal(result.deal) : null;
    const nextDeals = await loadDealsWithRetry((deal) => deal.id === pendingAdvanceDeal?.id);
    const resolvedDeal =
      updatedDeal ??
      nextDeals.find((deal) => deal.id === pendingAdvanceDeal?.id) ??
      pendingAdvanceDeal;

    setDeals((current) => {
      const mergedDeals = Array.isArray(nextDeals) && nextDeals.length > 0 ? nextDeals : current;
      const withoutDuplicate = mergedDeals.filter((deal) => deal.id !== resolvedDeal?.id);
      return resolvedDeal ? [resolvedDeal, ...withoutDuplicate] : mergedDeals;
    });

    setSelectedDeal(resolvedDeal ?? null);
    setPendingAdvanceDeal(null);
    setPage(resolvedDeal ? "workspace" : "dashboard");
  };

  const handleRejectProposal = async (requestId, proposalId) => {
    await requestService.rejectProposal(proposalId);
    const nextRequests = await requestService.listMine();
    const updatedRequest = nextRequests.find((item) => item.id === requestId);
    const updatedProposal = updatedRequest?.proposals.find((item) => item.id === proposalId) ?? null;
    setRequests(nextRequests);
    return updatedProposal;
  };

  const handleAddFeedback = (freelancerId, payload) => {
    const clientCompany = localStorage.getItem("client_company") || "Client";
    const nextEntry = {
      client: clientName,
      title: clientCompany,
      comment: payload.comment,
      stars: payload.stars,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    setFeedbackDirectory((current) => {
      const nextDirectory = {
        ...current,
        [freelancerId]: [nextEntry, ...(current[freelancerId] ?? [])],
      };
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(nextDirectory));
      return nextDirectory;
    });
  };

  const activeNavPage =
    page === "workspace" ? "dashboard" : page === "freelancerProfile" ? "requests" : page;

  const handleDealUpdate = (dealStatusUpdate) => {
    setDeals((current) =>
      current.map((deal) =>
        deal.id === dealStatusUpdate.dealId
          ? dealStatusUpdate.updatedDeal
            ? dealStatusUpdate.updatedDeal
            : {
                ...deal,
                status:
                  dealStatusUpdate.newStatus === "completed"
                    ? "Terminé"
                    : dealStatusUpdate.newStatus === "fully_paid"
                      ? "Totalité payé"
                      : "En cours",
                statusType:
                  dealStatusUpdate.newStatus === "completed"
                    ? "done"
                    : dealStatusUpdate.newStatus === "fully_paid"
                      ? "fully_paid"
                      : "progress",
                daysLeft: dealStatusUpdate.newStatus === "completed" ? null : deal.daysLeft,
              }
          : deal,
      ),
    );

    if (dealStatusUpdate.updatedDeal?.id) {
      setSelectedDeal((current) =>
        current?.id === dealStatusUpdate.updatedDeal.id ? dealStatusUpdate.updatedDeal : current,
      );
    }

    dealService.updateStatus({
      dealId: dealStatusUpdate.dealId,
      newStatus: dealStatusUpdate.newStatus,
    }).catch(() => null);
  };

  return (
    <div className="app-shell">
      <Navbar
        onDashboard={() => setPage("dashboard")}
        onRequests={() => setPage("requests")}
        onWallet={() => setPage("wallet")}
        onProfile={() => setPage("profile")}
        activePage={activeNavPage}
        navItems={clientNavItems}
        brandTitle="Espace Client"
        profileLabel="Profil"
        showProfile
      />

      <main className="app-main">
        {page === "dashboard" && (
          <ClientDashboard
            deals={deals}
            pendingRequestsCount={openRequests.length}
            onOpenWorkspace={openWorkspace}
            onDealUpdate={handleDealUpdate}
            onGoToWallet={() => setPage("wallet")}
          />
        )}

        {page === "requests" && (
          <ClientRequests
            requests={openRequests}
            isLoading={isLoadingData}
            errorMessage={requestsError}
            onCreateRequest={handleCreateRequest}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
            onAcceptProposal={handleAcceptProposal}
            onRejectProposal={handleRejectProposal}
            onViewFreelancerProfile={openFreelancerProfile}
          />
        )}

        {page === "profile" && (
          <FreelancerProfile
            variant="client"
            onBack={() => setPage("dashboard")}
            stats={[
              {
                label: "Demandes",
                value: String(openRequests.length),
                delta: "Actif",
                accent: "indigo",
              },
              {
                label: "Accords en cours",
                value: String(activeDealsCount),
                delta: "En suivi",
                accent: "indigo",
              },
              {
                label: "Accords terminés",
                value: String(completedDealsCount),
                delta: "Historique",
                accent: "green",
              },
            ]}
          />
        )}

        {page === "wallet" && <ClientWallet />}

        {page === "freelancerProfile" && selectedFreelancerProfile && (
          <ClientFreelancerProfile
            profile={selectedFreelancerProfile}
            feedbackEntries={feedbackDirectory[selectedFreelancerProfile.id] ?? []}
            onBack={() => setPage("requests")}
            onAddFeedback={handleAddFeedback}
          />
        )}

        {page === "workspace" && selectedDeal && (
          <Workspace
            deal={selectedDeal}
            onBack={() => setPage("dashboard")}
            viewerRole="client"
            participantName={clientName}
            backLabel="Retour au tableau de bord client"
            socket={socket}
            myUserId={localStorage.getItem("user_id")}
          />
        )}
      </main>

      {pendingAdvanceDeal && (
        <AdvancePaymentModal
          deal={pendingAdvanceDeal}
          onClose={() => setPendingAdvanceDeal(null)}
          onGoToWallet={() => {
            setPendingAdvanceDeal(null);
            setPage("wallet");
          }}
          onSuccess={handleAdvancePaymentSuccess}
        />
      )}

      {proposalToAccept && (
        <AdvancePaymentModal
          proposal={proposalToAccept}
          onClose={() => setProposalToAccept(null)}
          onGoToWallet={() => {
            setProposalToAccept(null);
            setPage("wallet");
          }}
          onSuccess={handleAcceptAndPaySuccess}
        />
      )}

      <Footer />
    </div>
  );
}
