const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("auth_token");

const buildHeaders = () => {
  const token = getToken();
  const headers = {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseJson = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Erreur API.");
  }

  return payload?.data ?? null;
};

const formatDealStatus = (status) => {
  if (status === "Termine") {
    return { status: "Complete", daysLeft: null };
  }

  if (status === "Soumis") {
    return { status: "Soumis" };
  }

  if (status === "En attente paiement final") {
    return { status: "En attente paiement final" };
  }

  return { status: status === "Actif" ? "En Cours" : status };
};

export const toUiDeal = (deal) => {
  const statusMeta = formatDealStatus(deal.status);
  const deadlineDate = deal.deadline ? new Date(deal.deadline) : null;
  const daysLeft =
    statusMeta.daysLeft === null
      ? null
      : deadlineDate
        ? Math.max(0, Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

  return {
    id: deal.id,
    requestId: deal.requestId,
    proposalId: deal.proposalId,
    clientId: deal.clientId,
    freelancerId: deal.freelancerId,
    freelancer: deal.freelancerName,
    client: deal.clientName,
    title: deal.title,
    description: deal.description,
    total: new Intl.NumberFormat("fr-FR").format(deal.finalPrice),
    remaining: new Intl.NumberFormat("fr-FR").format(Math.max(deal.finalPrice - deal.advanceAmount, 0)),
    deadline: deadlineDate
      ? deadlineDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      : "",
    daysLeft,
    urgent: daysLeft !== null && daysLeft <= 5,
    roomCode: `deal-${deal.id}`,
    status: statusMeta.status,
    progressLabel: `Deal lie a la demande #${deal.requestId}`,
  };
};

export const dealService = {
  listMine: async () => {
    const response = await fetch(`${API_BASE_URL}/deals`, {
      headers: buildHeaders(),
      cache: "no-store",
    });
    const deals = await parseJson(response);
    return Array.isArray(deals) ? deals.map(toUiDeal) : [];
  },
};
