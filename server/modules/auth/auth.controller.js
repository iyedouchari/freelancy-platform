import { successResponse } from "../../utils/apiResponse.js";
import { logAuthEvent } from "../../utils/logger.js";
import { getAuthUserById, login, register } from "./auth.service.js";
// Permet de vérifier que le module d'authentification est opérationnel en retournant un message de succès avec les routes disponibles pour l'authentification
export const registerController = async (req, res) => {
  const result = await register(req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "Inscription réussie.",
    data: result,
  });
};
// Permet de connecter un utilisateur en utilisant les informations fournies dans le corps de la requête, en vérifiant les identifiants, et en retournant les informations de l'utilisateur connecté avec un message de succès ou d'erreur selon le cas, tout en enregistrant l'événement de connexion pour des raisons de sécurité et d'audit
export const loginController = async (req, res) => {
  const result = await login(req.body);
  logAuthEvent("Utilisateur connecté", {
    userId: result?.user?.id,
    email: result?.user?.email,
    role: result?.user?.role,
    ip: req.ip,
  });

  return successResponse(res, {
    message: "Connexion réussie.",
    data: result,
  });
};

export const meController = async (req, res) => {
  const user = await getAuthUserById(req.auth.userId);
  return successResponse(res, {
    message: "Utilisateur authentifié récupéré.",
    data: user,
  });
};

export const logoutController = async (req, res) => {
  logAuthEvent("Utilisateur deconnecté", {
    userId: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
    ip: req.ip,
  });

  return successResponse(res, {
    message: "Déconnexion réussie côté API. Supprimez le token côté client.",
  });
};
