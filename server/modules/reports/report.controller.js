import { successResponse } from "../../utils/apiResponse.js";
import { reportService } from "./report.service.js";

export const createReport = async (req, res) => {
  const report = await reportService.createReport(req.user, req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "Report envoye avec succes.",
    data: report,
  });
};

export const listMyReports = async (req, res) => {
  const reports = await reportService.listMyReports(req.user);
  return successResponse(res, {
    message: "Vos reports ont ete charges.",
    data: reports,
  });
};
