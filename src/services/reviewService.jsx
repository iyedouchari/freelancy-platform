const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("auth_token");

const buildHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseJson = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Erreur API.");
  }

  return payload?.data ?? payload ?? null;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers || {}),
    },
  });

  return parseJson(response);
};

export const reviewService = {
  listForUser: async (userId) => {
    const result = await request(`/reviews/user/${userId}`);
    return Array.isArray(result) ? result : [];
  },

  save: async ({ dealId, toUserId, score, comment }) =>
    request("/reviews", {
      method: "POST",
      body: JSON.stringify({ dealId, toUserId, score, comment }),
    }),

  create: async ({ dealId, toUserId, score, comment }) =>
    request("/reviews", {
      method: "POST",
      body: JSON.stringify({ dealId, toUserId, score, comment }),
    }),
};
