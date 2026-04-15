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
    // Ignore JSON parsing errors.
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

export const paymentService = {
  getByDeal: (dealId) => sendRequest(`/payments/deal/${dealId}`),

  payAdvance: ({ dealId, freelancerId = null, amount }) =>
    sendRequest("/payments/advance", {
      method: "POST",
      body: JSON.stringify({ dealId, freelancerId, amount }),
    }),

  payFinal: ({ dealId, freelancerId = null, amount }) =>
    sendRequest("/payments/final", {
      method: "POST",
      body: JSON.stringify({ dealId, freelancerId, amount }),
    }),

  payTotal: ({ dealId, freelancerId = null, totalAmount, advanceAmount, deadline }) =>
    sendRequest("/payments/total", {
      method: "POST",
      body: JSON.stringify({ dealId, freelancerId, totalAmount, advanceAmount, deadline }),
    }),

  refund: ({ paymentId }) =>
    sendRequest(`/payments/${paymentId}/refund`, {
      method: "POST",
    }),
};
