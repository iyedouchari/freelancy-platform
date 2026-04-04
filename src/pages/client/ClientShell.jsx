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
import socket from "../../services/socket.js";

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
  return null;
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

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function ClientShell() {
  const initialDeal = getInitialDeal();
  const [page, setPage] = useState(() => resolveInitialClientPage(Boolean(initialDeal)));
  const [requests, setRequests] = useState([]);
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(initialDeal);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(null);
  const [feedbackDirectory, setFeedbackDirectory] = useState(loadFeedbackDirectory);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [requestsError, setRequestsError] = useState("");

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
        setSelectedDeal((current) => current ?? dealRows[0] ?? null);
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

  const handleAcceptProposal = async (requestId, proposalId) => {
    const acceptanceResult = await requestService.acceptProposal(proposalId);
    const acceptedDeal = acceptanceResult?.deal ? toUiDeal(acceptanceResult.deal) : null;
    const [nextRequests, nextDeals] = await Promise.all([
      requestService.listMine(),
      loadDealsWithRetry((deal) => deal.requestId === requestId && deal.proposalId === proposalId),
    ]);
    const createdDeal =
      acceptedDeal ??
      nextDeals.find((deal) => deal.requestId === requestId && deal.proposalId === proposalId) ??
      nextDeals[0] ??
      null;

    setRequests((current) => {
      const apiRequests = Array.isArray(nextRequests) ? nextRequests : [];
      const filteredCurrent = current.filter((item) => item.id !== requestId);
      if (apiRequests.length > 0) {
        return apiRequests.filter((item) => item.status === "Ouverte");
      }
      return filteredCurrent;
    });

    setDeals((current) => {
      if (!createdDeal) {
        return Array.isArray(nextDeals) ? nextDeals : current;
      }

      const mergedDeals = Array.isArray(nextDeals) && nextDeals.length > 0 ? nextDeals : current;
      const withoutDuplicate = mergedDeals.filter((deal) => deal.id !== createdDeal.id);
      return [createdDeal, ...withoutDuplicate];
    });

    setSelectedDeal(createdDeal);
    setPage(createdDeal ? "workspace" : "dashboard");
    return createdDeal;
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
          />
        )}

        {page === "requests" && (
          <ClientRequests
            requests={openRequests}
            isLoading={isLoadingData}
            errorMessage={requestsError}
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
                value: String(openRequests.length),
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
            socket={socket}
            myUserId={localStorage.getItem("user_id")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
