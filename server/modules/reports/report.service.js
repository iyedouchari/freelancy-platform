import AppError from "../../utils/AppError.js";
import { reportRepository } from "./report.repository.js";

const parsePositiveId = (value, label = "Id") => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new AppError(`${label} invalide.`, 400, "INVALID_ID");
  }

  return parsed;
};

export const reportService = {
  async createReport(currentUser, payload) {
    const reporterId = parsePositiveId(currentUser.id, "Reporter id");
    const reportedUserId = parsePositiveId(payload.reportedUserId, "Reported user id");
    const dealId =
      payload.dealId === null || payload.dealId === undefined || payload.dealId === ""
        ? null
        : parsePositiveId(payload.dealId, "Deal id");

    if (reporterId === reportedUserId) {
      throw new AppError("Vous ne pouvez pas vous signaler vous-meme.", 400, "SELF_REPORT_FORBIDDEN");
    }

    const existing = await reportRepository.findExistingOpenReport(reporterId, reportedUserId, dealId);
    if (existing) {
      throw new AppError(
        "Un report ouvert existe deja pour cet utilisateur sur cet accord.",
        409,
        "REPORT_ALREADY_EXISTS",
      );
    }

    return reportRepository.create({
      reporterId,
      reportedUserId,
      dealId,
      reason: payload.reason,
      details: payload.details,
    });
  },

  async listMyReports(currentUser) {
    const reporterId = parsePositiveId(currentUser.id, "Reporter id");
    return reportRepository.listForReporter(reporterId);
  },
};
