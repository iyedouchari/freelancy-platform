const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const API_UNREACHABLE_MESSAGE =
  "Impossible de contacter l'API. Verifie que le serveur backend tourne avec: npm run dev:server";

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.message) return payload.message;
  } catch (_error) {
    // Ignore JSON parse errors.
  }
  return "Une erreur est survenue.";
};

const sendRequest = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: getAuthHeaders(),
      ...options,
    });
  } catch (_error) {
    throw new Error(API_UNREACHABLE_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

const formatDealStatus = (status) => {
  if (status === "Terminé" || status === "Termine") {
    return { status: "Terminé", daysLeft: null, statusType: "done" };
  }

  if (status === "En attente acompte") {
    return { status: "En attente acompte", statusType: "waiting_advance" };
  }

  if (status === "Totalité payé") {
    return { status: "Totalité payé", statusType: "fully_paid" };
  }

  if (status === "Soumis") {
    return { status: "Soumis", statusType: "submitted" };
  }

  if (status === "En attente paiement final") {
    return { status: "En attente paiement final", statusType: "review" };
  }

  if (status === "Actif" || status === "Avance payé" || status === "En cours") {
    return { status: "En cours", statusType: "progress" };
  }

  return {
    status: status || "En cours",
    statusType: "review",
  };
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

  const finalPrice = Number(deal.finalPrice ?? deal.final_price ?? 0);
  const advanceAmount = Number(deal.advanceAmount ?? deal.advance_amount ?? 0);
  const paidAmount = Number(deal.paidAmount ?? deal.paid_amount ?? 0);
  const remainingAmount =
    deal.remainingAmount ?? deal.remaining_amount ?? Math.max(finalPrice - paidAmount, 0);

  return {
    id: deal.id,
    requestId: deal.requestId ?? deal.request_id,
    proposalId: deal.proposalId ?? deal.proposal_id,
    clientId: deal.clientId ?? deal.client_id,
    freelancerId: deal.freelancerId ?? deal.freelancer_id,
    freelancer: deal.freelancerName ?? deal.freelancer_name,
    freelancerTitle: deal.freelancerTitle ?? deal.freelancer_title ?? "",
    client: deal.clientName ?? deal.client_name,
    title: deal.title ?? deal.request_title,
    description: deal.description ?? deal.request_description,
    total: new Intl.NumberFormat("fr-FR").format(finalPrice),
    advanceAmount,
    paidAmount,
    remainingAmount: Number(remainingAmount),
    remaining: new Intl.NumberFormat("fr-FR").format(Math.max(Number(remainingAmount), 0)),
    deadline: deadlineDate
      ? deadlineDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      : "",
    daysLeft,
    urgent: daysLeft !== null && daysLeft <= 5,
    roomCode: `deal-${deal.id}`,
    status: statusMeta.status,
    statusType: statusMeta.statusType,
    location: deal.clientName || deal.client_name ? `Client : ${deal.clientName ?? deal.client_name}` : "",
    progressLabel:
      String(deal.description ?? deal.request_description ?? "").trim() ||
      `Demande n°${deal.requestId ?? deal.request_id}`,
    paymentNote: deal.paymentNote ?? deal.payment_note ?? "",
    advancePaid: Boolean(deal.advancePaid ?? deal.advance_paid_count),
    finalPaid: Boolean(deal.finalPaid ?? deal.final_paid_count),
    finalSubmitted: statusMeta.statusType === "done",
  };
};

export const dealService = {
  listMine: async () => {
    const response = await sendRequest("/deals/my");
    const deals = Array.isArray(response?.deals)
      ? response.deals
      : Array.isArray(response?.data)
        ? response.data
        : [];
    return deals.map(toUiDeal);
  },

  getMyDeals: async () => {
    return sendRequest("/deals/my");
  },

  syncAcceptedDeal: ({ request, proposal, agreement }) =>
    sendRequest("/deals/sync-accepted", {
      method: "POST",
      body: JSON.stringify({ request, proposal, agreement }),
    }),

  updateStatus: ({ dealId, newStatus }) =>
    sendRequest(`/deals/${dealId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ newStatus }),
    }),
};
