const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("auth_token");

const buildHeaders = () => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
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

export const reportService = {
  create: async ({ reportedUserId, dealId, reason, details }) => {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: "POST",
      cache: "no-store",
      headers: buildHeaders(),
      body: JSON.stringify({ reportedUserId, dealId, reason, details }),
    });

    return parseJson(response);
  },
};
