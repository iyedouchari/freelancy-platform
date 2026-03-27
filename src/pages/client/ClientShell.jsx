import { useMemo, useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import PaymentModal from "../../components/PaymentModal";
import {
  createClientDealFromRequest,
  createClientRequest,
  getFreelancerProfileById,
  initialClientDeals,
  initialClientRequests,
  initialFreelancerFeedbackById,
  updateClientRequest,
} from "../../data/clientData";
import ClientDashboard from "./ClientDashboard";
import ClientFreelancerProfile from "./ClientFreelancerProfile";
import ClientProfile from "./ClientProfile";
import ClientRequests from "./ClientRequests";
import ClientWallet from "./ClientWallet";
import Workspace from "../shared/Workspace";

const FEEDBACK_STORAGE_KEY = "client_feedback_directory";

const clientNavItems = [
  { key: "dashboard", label: "Tableau de bord", actionProp: "onDashboard" },
  { key: "requests", label: "Demandes", actionProp: "onRequests" },
  { key: "wallet", label: "Wallet", actionProp: "onWallet" },
];

function resolveClientName() {
  return localStorage.getItem("client_name") || "Iyed";
}

function getInitialDeal() {
  return initialClientDeals.find((deal) => deal.daysLeft !== null) ?? initialClientDeals[0] ?? null;
}

function resolveInitialClientPage(hasDeal) {
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

export default function ClientShell() {
  const initialDeal = getInitialDeal();
  const [page, setPage] = useState(() => resolveInitialClientPage(Boolean(initialDeal)));
  const [requests, setRequests] = useState(initialClientRequests);
  const [deals, setDeals] = useState(initialClientDeals);
  const [selectedDeal, setSelectedDeal] = useState(initialDeal);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(null);
  const [feedbackDirectory, setFeedbackDirectory] = useState(loadFeedbackDirectory);

  // ─── Module 4 : état PaymentModal ─────────────────────────────────────────
  const [paymentModal, setPaymentModal] = useState({ open: false, deal: null });

  const clientName = useMemo(() => resolveClientName(), []);
  const activeDealsCount = deals.filter((deal) => deal.daysLeft !== null).length;
  const completedDealsCount = deals.filter((deal) => deal.daysLeft === null).length;
  const selectedFreelancerProfile = selectedFreelancerId
    ? getFreelancerProfileById(selectedFreelancerId)
    : null;

  const openWorkspace = (dealOrId) => {
    const resolvedDeal =
      typeof dealOrId === "object"
        ? dealOrId
        : deals.find((deal) => deal.id === dealOrId) ?? deals[0] ?? null;

    if (!resolvedDeal) return;

    setSelectedDeal(resolvedDeal);
    setPage("workspace");
  };

  const openFreelancerProfile = (freelancerId) => {
    setSelectedFreelancerId(freelancerId);
    setPage("freelancerProfile");
  };

  const handleCreateRequest = (payload) => {
    const createdRequest = createClientRequest(payload);
    setRequests((current) => [createdRequest, ...current]);
    return createdRequest;
  };

  const handleUpdateRequest = (requestId, payload) => {
    let updatedRequest = null;

    setRequests((current) =>
      current.map((item) => {
        if (item.id !== requestId) return item;
        updatedRequest = updateClientRequest(item, payload);
        return updatedRequest;
      })
    );

    return updatedRequest;
  };

  // ─── Module 4 : accepter une proposition → ouvrir modale acompte ──────────
  const handleAcceptProposal = (requestId, proposalId) => {
    const request = requests.find((item) => item.id === requestId);
    const proposal = request?.proposals.find((item) => item.id === proposalId);

    if (!request || !proposal) return null;

    const createdDeal = createClientDealFromRequest(request, proposal);

    setDeals((current) => [createdDeal, ...current]);
    setRequests((current) => current.filter((item) => item.id !== requestId));
    setSelectedDeal(createdDeal);

    // Ouvre la modale de paiement acompte 20%
    setPaymentModal({ open: true, deal: createdDeal });

    return createdDeal;
  };

  // ─── Module 4 : succès paiement acompte ───────────────────────────────────
  const handlePaymentSuccess = () => {
    setPaymentModal({ open: false, deal: null });
    setPage("dashboard");
  };

  // ─── Module 4 : mise à jour deal après paiement final (depuis Workspace) ──
  const handleDealUpdate = (dealStatusUpdate) => {
    setDeals((current) =>
      current.map((d) =>
        d.id === dealStatusUpdate.dealId
          ? { ...d, status: "Complete", statusType: "done", daysLeft: null }
          : d
      )
    );
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
            pendingRequestsCount={requests.length}
            onOpenWorkspace={openWorkspace}
          />
        )}

        {page === "requests" && (
          <ClientRequests
            requests={requests}
            onCreateRequest={handleCreateRequest}
            onUpdateRequest={handleUpdateRequest}
            onAcceptProposal={handleAcceptProposal}
            onViewFreelancerProfile={openFreelancerProfile}
          />
        )}

        {page === "profile" && (
          <ClientProfile
            requestsCount={requests.length}
            activeDealsCount={activeDealsCount}
            completedDealsCount={completedDealsCount}
            onBack={() => setPage("dashboard")}
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
            onDealUpdate={handleDealUpdate}
            viewerRole="client"
            participantName={clientName}
            backLabel="Retour au tableau de bord client"
          />
        )}
      </main>

      <Footer />

      {/* ─── Module 4 : PaymentModal acompte ─────────────────────────────── */}
      <PaymentModal
        isOpen={paymentModal.open}
        phase="advance"
        deal={paymentModal.deal}
        onSuccess={handlePaymentSuccess}
        onClose={() => {
          setPaymentModal({ open: false, deal: null });
          setPage("dashboard");
        }}
      />
    </div>
  );
}