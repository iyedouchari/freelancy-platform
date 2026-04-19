import { successResponse } from "../../utils/apiResponse.js";
import { reportService } from "./report.service.js";
// Permet de créer un nouveau signalement en utilisant les informations fournies dans le corps de la requête, et en associant le signalement à l'utilisateur connecté, puis en retournant le signalement créé avec un message de succès
export const createReport = async (req, res) => {
  const report = await reportService.createReport(req.user, req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "Signalement envoyé avec succès.",
    data: report,
  });
};
// Permet de récupérer la liste des signalements liés à l'utilisateur connecté, en fonction de son rôle (client ou freelancer), et de retourner les résultats avec un message de succès
export const listMyReports = async (req, res) => {
  const reports = await reportService.listMyReports(req.user);
  return successResponse(res, {
    message: "Votre signalement a été chargé.",
    data: reports,
  });
};
