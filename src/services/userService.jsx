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

  return payload?.data ?? payload?.user ?? payload ?? null;
};

const request = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        ...buildHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw new Error(
      `Impossible de contacter l'API.${error?.message ? ` (${error.message})` : ""}`,
    );
  }

  return parseJson(response);
};

const getCurrentUserId = () => String(localStorage.getItem("user_id") || "").trim();

const normalizeUserPayload = (payload = {}) => ({
  name: payload.name,
  title: payload.title,
  email: payload.email,
  phone: payload.phone ?? payload.telephone,
  telephone: payload.telephone ?? payload.phone,
  location: payload.location,
  bio: payload.bio,
  avatarUrl: payload.profileImage ?? payload.avatarUrl,
  profileImage: payload.profileImage ?? payload.avatarUrl,
});

export const userService = {
  getMe: async () => {
    return request("/users/me");
  },

  getById: async (userId) => {
    return request(`/users/${userId}`);
  },

  updateMe: async (payload = {}) => {
    const userId = getCurrentUserId();
    const body = JSON.stringify(normalizeUserPayload(payload));

    try {
      return await request("/users/me", {
        method: "PATCH",
        body,
      });
    } catch (error) {
      if (!userId) {
        throw error;
      }

      return request(`/users/${userId}`, {
        method: "PATCH",
        body,
      });
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const userId = getCurrentUserId();

    if (!String(currentPassword || "").trim()) {
      throw new Error("Le mot de passe actuel est requis.");
    }

    if (!String(newPassword || "").trim()) {
      throw new Error("Le nouveau mot de passe est requis.");
    }

    try {
      return await request("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (error) {
      if (!userId) {
        throw error;
      }

      return request(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword }),
      });
    }
  },
};
