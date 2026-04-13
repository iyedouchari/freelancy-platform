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

export const adminService = {
  listUsers: async () => request("/admin/users"),
  getUserById: async (userId) => request(`/admin/users/${userId}`),
  getUserByEmail: async (email) => {
    const normalizedEmail = encodeURIComponent(String(email || "").trim().toLowerCase());
    return request(`/admin/users/search?email=${normalizedEmail}`);
  },
  listReports: async () => request("/admin/reports"),
  getReportById: async (reportId) => request(`/admin/reports/${reportId}`),
  closeReport: async (reportId) => {
    return request(`/admin/reports/${reportId}/close`, {
      method: "PATCH",
    });
  },
  updateReportStatus: async (reportId, status) => {
    return request(`/admin/reports/${reportId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  banUser: async (userId, payload) => {
    return request(`/admin/users/${userId}/ban`, {
      method: "PATCH",
      body: JSON.stringify({
        reason: payload?.reason,
        durationDays: payload?.durationDays,
      }),
    });
  },
  unbanUser: async (userId) => {
    return request(`/admin/users/${userId}/unban`, {
      method: "PATCH",
    });
  },
  notifyBannedUser: async (reportId, payload) => {
    return request(`/admin/reports/${reportId}/notify-banned-user`, {
      method: "POST",
      body: JSON.stringify({
        reason: payload?.reason,
        durationDays: payload?.durationDays,
      }),
    });
  },
  notifyReporter: async (reportId, outcome) => {
    return request(`/admin/reports/${reportId}/notify-reporter`, {
      method: "POST",
      body: JSON.stringify({ outcome }),
    });
  },
};
