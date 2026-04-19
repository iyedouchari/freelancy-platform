const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const REQUEST_TIMEOUT_MS = 20000;

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
    if (payload?.error) return payload.error;
  } catch (_error) {
    // Ignore JSON parsing errors.
  }
  return `Erreur ${response.status} — ${response.statusText || "Une erreur est survenue."}`;
};

const sendRequest = async (path, options = {}) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: getAuthHeaders(),
      signal: controller.signal,
      ...options,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("La requete a pris trop de temps. Verifie le serveur puis reessaie.");
    }
    throw new Error(API_UNREACHABLE_MESSAGE);
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

export const walletService = {
  getWallet: () => sendRequest("/wallet"),

  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return sendRequest(`/wallet/transactions${query ? `?${query}` : ""}`);
  },

  topup: (amount) =>
    sendRequest("/wallet/topup", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  withdraw: (amount, bankAccountMasked) =>
    sendRequest("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, bankAccountMasked }),
    }),

  getDealPaymentSummary: (dealId) =>
    sendRequest(`/wallet/deals/${dealId}/summary`),

  payAdvance: (dealId) =>
    sendRequest(`/wallet/deals/${dealId}/pay-advance`, {
      method: "POST",
    }),

  payFinal: (dealId, amount) =>
    sendRequest(`/wallet/deals/${dealId}/pay-final`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  payTotal: (dealId) =>
    sendRequest(`/wallet/deals/${dealId}/pay-total`, {
      method: "POST",
    }),
};
