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

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      ...buildHeaders(),
      ...(options.headers || {}),
    },
  });

  return parseJson(response);
};

const normalizeRequestPayload = (payload) => ({
  title: payload.title,
  description: payload.description,
  domain: payload.category,
  budget: Number(payload.budget),
  deadline: payload.deadline,
  negotiable: Boolean(payload.negotiable),
  skills: Array.isArray(payload.skills) ? payload.skills : [],
});

export const requestService = {
  listMine: async () => {
    const result = await request("/requests/my");
    return result?.data ?? [];
  },

  listOpen: async () => {
    const result = await request("/requests?status=Ouverte&limit=100");
    return result?.data ?? [];
  },

  create: async (payload) => {
    return request("/requests", {
      method: "POST",
      body: JSON.stringify(normalizeRequestPayload(payload)),
    });
  },

  update: async (requestId, payload) => {
    return request(`/requests/${requestId}`, {
      method: "PUT",
      body: JSON.stringify(normalizeRequestPayload(payload)),
    });
  },

  acceptProposal: async (proposalId) => {
    return request(`/proposals/${proposalId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Acceptee" }),
    });
  },

  rejectProposal: async (proposalId) => {
    return request(`/proposals/${proposalId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Refusee" }),
    });
  },

  createProposal: async ({ requestId, proposedPrice, proposedDeadline, coverLetter }) => {
    return request("/proposals", {
      method: "POST",
      body: JSON.stringify({
        requestId,
        proposedPrice,
        proposedDeadline,
        coverLetter,
      }),
    });
  },
};
