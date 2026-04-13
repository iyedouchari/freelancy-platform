import { successResponse } from "../../utils/apiResponse.js";
import { reportService } from "./report.service.js";

export const createReport = async (req, res) => {
  const report = await reportService.createReport(req.user, req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "Signalement envoyé avec succès.",
    data: report,
  });
};

export const listMyReports = async (req, res) => {
  const reports = await reportService.listMyReports(req.user);
  return successResponse(res, {
    message: "Votre signalement a été chargé.",
    data: reports,
  });
};
