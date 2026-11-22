import { buildApiUrl } from "../config/api.js";

const parseErrorMessage = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    // Non-JSON response (e.g. gateway error or static page)
  }

  // If backend provided a specific operational message (other than generic Internal Server Error)
  if (payload?.message && payload.message !== "Internal Server Error") {
    return payload.message;
  }

  if (response.status === 401) {
    return "Adresse email ou mot de passe incorrect.";
  }
  if (response.status === 403) {
    return "Accès refusé. Compte non autorisé ou suspendu.";
  }
  if (response.status === 404) {
    return `Route d'authentification introuvable (HTTP 404). Vérifiez l'URL du serveur (${response.url}).`;
  }
  if (response.status === 405) {
    return `Méthode non autorisée (HTTP 405). Vérifiez l'URL de l'API (${response.url}).`;
  }
  if (response.status === 409) {
    return "Un utilisateur avec cette adresse email existe déjà.";
  }
  if (response.status === 429) {
    return "Trop de tentatives. Veuillez patienter une minute avant de réessayer.";
  }
  if ([502, 503, 504, 524].includes(response.status)) {
    return `Le serveur Render est en cours de réveil ou temporairement indisponible (HTTP ${response.status}). Veuillez patienter 30 secondes et réessayer.`;
  }
  if (response.status >= 500) {
    return `Une erreur serveur est survenue (HTTP ${response.status}). ${payload?.message || "Veuillez réessayer dans un instant."}`;
  }

  return `Erreur HTTP ${response.status} lors de l'authentification.`;
};

const sendAuthRequest = async (path, payload) => {
  const url = buildApiUrl(path);
  let response;

  try {
    response = await fetch(url, {
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
    throw new Error(
      `Impossible de contacter le serveur (${error?.message || "Erreur réseau / CORS"}). Vérifiez votre connexion.`
    );
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  try {
    const body = await response.json();
    return body?.data || null;
  } catch (_e) {
    throw new Error("Réponse inattendue du serveur.");
  }
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
