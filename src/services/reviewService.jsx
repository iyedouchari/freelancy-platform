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
    const errorMsg = payload?.message || `Erreur HTTP ${response.status}`;
    throw new Error(errorMsg);
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
    const reviews = Array.isArray(result) ? result : [];
    return reviews.map(review => ({
      ...review,
      fromUserId: review.fromUserId || review.from_user_id,
      toUserId: review.toUserId || review.to_user_id,
    }));
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

  update: async (reviewId, { score, comment }) =>
    request(`/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ score, comment }),
    }),

  delete: async (reviewId) =>
    request(`/reviews/${reviewId}`, {
      method: "DELETE",
    }),
};
