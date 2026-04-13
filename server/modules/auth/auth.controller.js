import { successResponse } from "../../utils/apiResponse.js";
import { logAuthEvent } from "../../utils/logger.js";
import { getAuthUserById, login, register } from "./auth.service.js";

export const registerController = async (req, res) => {
  const result = await register(req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "Inscription réussie.",
    data: result,
  });
};

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
