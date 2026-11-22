const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.message) {
      return payload.message;
    }
  } catch (_error) {
    // Ignore invalid JSON and fall back to status-specific message.
  }

  if (response.status === 401) {
    return "Adresse email ou mot de passe incorrect.";
  }
  if (response.status === 403) {
    return "Accès refusé. Veuillez vérifier vos identifiants.";
  }
  if (response.status === 409) {
    return "Un utilisateur avec cette adresse email existe déjà.";
  }
  if (response.status === 429) {
    return "Trop de tentatives. Veuillez patienter une minute avant de réessayer.";
  }
  if ([502, 503, 504, 524].includes(response.status)) {
    return "Le serveur est en cours de réveil ou temporairement indisponible. Veuillez patienter quelques secondes et réessayer.";
  }

  return "Une erreur est survenue lors de l'authentification.";
};

const API_UNREACHABLE_MESSAGE =
  "Impossible de contacter le serveur. Veuillez vérifier votre connexion ou réessayer dans un instant.";

const sendAuthRequest = async (path, payload) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(`${API_UNREACHABLE_MESSAGE}${error?.message ? ` (${error.message})` : ""}`);
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
    const defaultTitle =
      profile.title ||
      profile.professionalTitle ||
      (role === "freelancer" ? "Freelance" : "Client");
    return sendAuthRequest("/auth/register", {
      name,
      email,
      password,
      role,
      title: defaultTitle,
      professionalTitle: defaultTitle,
      ...profile,
    });
  },
  logout: () => {},
};
