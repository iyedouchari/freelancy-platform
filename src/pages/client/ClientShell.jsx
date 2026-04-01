import { useMemo, useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
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
import ClientRequests from "./ClientRequests";
import ClientWallet from "./ClientWallet";
import FreelancerProfile from "../freelancer/FreelancerProfile";
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

  const handleCreateRequest = (payload) => {
    const createdRequest = createClientRequest(payload);
    setRequests((current) => [createdRequest, ...current]);
    return createdRequest;
  };

  const handleUpdateRequest = (requestId, payload) => {
    let updatedRequest = null;

    setRequests((current) =>
      current.map((item) => {
        if (item.id !== requestId) {
          return item;
        }

        updatedRequest = updateClientRequest(item, payload);
        return updatedRequest;
      })
    );

    return updatedRequest;
  };

  const handleAcceptProposal = (requestId, proposalId) => {
    const request = requests.find((item) => item.id === requestId);
    const proposal = request?.proposals.find((item) => item.id === proposalId);

    if (!request || !proposal) {
      return null;
    }

    const agreement = request.negotiable
      ? {
          price: Number(proposal.rate),
          deadline: proposal.proposedDeadline ?? request.deadline,
        }
      : {
          price: Number(request.budget),
          deadline: request.deadline,
        };

    const createdDeal = createClientDealFromRequest(request, proposal, agreement);

    setDeals((current) => [createdDeal, ...current]);
    setRequests((current) => current.filter((item) => item.id !== requestId));
    setSelectedDeal(createdDeal);
    setPage("dashboard");

    return createdDeal;
  };

  const handleRejectProposal = (requestId, proposalId) => {
    let updatedProposal = null;

    setRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) {
          return request;
        }

        return {
          ...request,
          proposals: request.proposals.map((proposal) => {
            if (proposal.id !== proposalId) {
              return proposal;
            }

            updatedProposal = {
              ...proposal,
              status: "rejected",
            };
            return updatedProposal;
          }),
        };
      })
    );

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
                value: String(requests.length),
                delta: "Actif",
                accent: "indigo",
              },
              {
                label: "Deals en cours",
                value: String(activeDealsCount),
                delta: "En suivi",
                accent: "indigo",
              },
              {
                label: "Deals termines",
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
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
