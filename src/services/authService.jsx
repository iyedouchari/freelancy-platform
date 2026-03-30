const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.message) {
      return payload.message;
    }
  } catch (_error) {
    // Ignore invalid JSON and fall back to generic message.
  }

  return "Une erreur est survenue lors de l'authentification.";
};

const API_UNREACHABLE_MESSAGE =
  "Impossible de contacter l'API. Verifie que le serveur backend tourne avec: npm run dev:server";

const sendAuthRequest = async (path, payload) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (_error) {
    throw new Error(API_UNREACHABLE_MESSAGE);
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const body = await response.json();
  return body?.data || null;
};

export const authService = {
  login: async ({ email, password }) => {
    return sendAuthRequest("/auth/login", { email, password });
  },
  register: async ({ name, email, password, role, ...profile }) => {
    return sendAuthRequest("/auth/register", { name, email, password, role, ...profile });
  },
  logout: () => {},
};
