import { DOMAIN_OPTIONS } from "../data/domains";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const REQUEST_TIMEOUT_MS = 30000;

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
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        ...buildHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("La requete a pris trop de temps. Verifiez le serveur puis reessayez.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  return parseJson(response);
};

const normalizeRequestPayload = (payload) => ({
  title: payload.title,
  description: payload.description,
  domain: payload.category ?? payload.domains?.[0],
  domains: Array.isArray(payload.domains)
    ? payload.domains
    : payload.category
      ? [payload.category]
      : [],
  budget: Number(payload.budget),
  deadline: payload.deadline,
  negotiable: Boolean(payload.negotiable),
  skills: Array.isArray(payload.skills)
    ? [
        ...(Array.isArray(payload.domains)
          ? payload.domains.filter((domain) => domain && domain !== payload.category)
          : []),
        ...payload.skills.filter(Boolean),
      ].filter((item, index, array) => array.indexOf(item) === index)
    : Array.isArray(payload.domains)
      ? payload.domains.filter((domain) => domain && domain !== payload.category && DOMAIN_OPTIONS.includes(domain))
      : [],
});

export const requestService = {
  listMine: async () => {
    const result = await request("/requests/my");
    if (Array.isArray(result)) {
      return result;
    }

    return result?.rows ?? result?.data ?? [];
  },

  listOpen: async () => {
    const result = await request("/requests?status=Ouverte&limit=100");
    if (Array.isArray(result)) {
      return result;
    }

    return result?.rows ?? result?.data ?? [];
  },

  listMatching: async () => {
    const result = await request("/requests/matching?limit=100");
    if (Array.isArray(result)) {
      return result;
    }

    return result?.rows ?? result?.data ?? [];
  },

  getMyDomains: async () => {
    const result = await request("/requests/freelancer/domains");
    return Array.isArray(result) ? result : result?.data ?? [];
  },

  addMyDomain: async (domain) => {
    return request("/requests/freelancer/domains", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
  },

  syncFreelancerDomains: async (domains = []) => {
    const normalizedDomains = [...new Set((Array.isArray(domains) ? domains : []).map((item) => String(item || "").trim()).filter(Boolean))];

    if (!normalizedDomains.length) {
      return [];
    }

    const existingDomains = await requestService.getMyDomains().catch(() => []);
    const existingSet = new Set(existingDomains.map((item) => String(item || "").trim()));

    for (const domain of normalizedDomains) {
      if (!existingSet.has(domain)) {
        await requestService.addMyDomain(domain);
      }
    }

    return requestService.getMyDomains();
  },

  listMyProposals: async () => {
    const result = await request("/proposals/my");
    if (Array.isArray(result)) {
      return result;
    }

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

  remove: async (requestId) => {
    return request(`/requests/${requestId}`, {
      method: "DELETE",
    });
  },

  acceptAndPayProposal: async (proposalId) => {
    return request(`/proposals/${proposalId}/accept-and-pay`, {
      method: "POST",
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

  cancelProposal: async (proposalId) => {
    return request(`/proposals/${proposalId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Annulee" }),
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
