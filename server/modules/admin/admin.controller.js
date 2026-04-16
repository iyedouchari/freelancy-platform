import { successResponse } from "../../utils/apiResponse.js";
import { adminService } from "./admin.service.js";

export const listAdminUsers = async (_req, res) => {
  const users = await adminService.listUsers();
  return successResponse(res, {
    message: "Liste des utilisateurs chargee.",
    data: users,
  });
};

export const getAdminUserById = async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  return successResponse(res, {
    message: "Informations utilisateur chargees.",
    data: user,
  });
};

export const getAdminUserByEmail = async (req, res) => {
  const user = await adminService.getUserByEmail(req.query.email);
  return successResponse(res, {
    message: "Informations utilisateur chargees.",
    data: user,
  });
};

export const listAdminReports = async (_req, res) => {
  const reports = await adminService.listReports();
  return successResponse(res, {
    message: "Liste des reports chargee.",
    data: reports,
  });
};

export const getAdminReportById = async (req, res) => {
  const report = await adminService.getReportById(req.params.id);
  return successResponse(res, {
    message: "Détails du report chargés.",
    data: report,
  });
};

export const closeAdminReport = async (req, res) => {
  const report = await adminService.closeReport(req.params.id);
  return successResponse(res, {
    message: "Signalement ferme avec succes.",
    data: report,
  });
};

export const updateAdminReportStatus = async (req, res) => {
  const report = await adminService.updateReportStatus(req.params.id, req.body?.status);
  return successResponse(res, {
    message: "Statut du signalement mis a jour.",
    data: report,
  });
};

export const banAdminUser = async (req, res) => {
  const user = await adminService.banUser(req.auth.userId, req.params.id, req.body);
  return successResponse(res, {
    message: "Utilisateur banni avec succes.",
    data: user,
  });
};

export const unbanAdminUser = async (req, res) => {
  const user = await adminService.unbanUser(req.params.id);
  return successResponse(res, {
    message: "Utilisateur debanni avec succes.",
    data: user,
  });
};

export const deleteAdminUser = async (req, res) => {
  const result = await adminService.deleteUser(req.auth.userId, req.params.id);
  return successResponse(res, {
    message: "Utilisateur supprime avec succes.",
    data: result,
  });
};

export const notifyBannedUserByEmail = async (req, res) => {
  const report = await adminService.notifyBannedUser(req.params.id, req.body);
  return successResponse(res, {
    message: "Email de suspension envoye.",
    data: report,
  });
};

export const notifyReporterByEmail = async (req, res) => {
  const report = await adminService.notifyReporter(req.params.id, req.body?.outcome);
  return successResponse(res, {
    message: "Email au reporteur envoyé.",
    data: report,
  });
};
