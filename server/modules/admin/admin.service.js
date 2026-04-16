import AppError from "../../utils/AppError.js";
import { mailer } from "../../utils/mailer.js";
import { adminRepository } from "./admin.repository.js";
import { disconnectUser } from "../../config/socketManager.js";

const parsePositiveId = (value, label = "Id") => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new AppError(`${label} invalide.`, 400, "INVALID_ID");
  }

  return parsed;
};

const parseDurationDays = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new AppError("La durée du ban doit etre un nombre positif de jours.", 400, "INVALID_BAN_DURATION");
  }

  return parsed;
};

const isForeignKeyConstraintError = (error) =>
  error?.errno === 1451 ||
  error?.code === "ER_ROW_IS_REFERENCED_2" ||
  String(error?.sqlMessage || error?.message || "").includes("a foreign key constraint fails");

const computeSuspendedUntilFromDuration = (durationDays) => {
  if (!durationDays) {
    return null;
  }

  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
};

const formatDeadline = (value) => {
  if (!value) {
    return "date de retour non definie";
  }

  try {
    return new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
};

const formatDurationLabel = (value) => {
  const days = Number.parseInt(value, 10);
  if (Number.isNaN(days) || days <= 0) {
    return "durée non definie";
  }

  return `${days} jour${days > 1 ? "s" : ""}`;
};

const buildBanDetailsText = ({ reason, suspendedUntil, durationDays }) =>
  `Raison: ${reason}\nDate de retour: ${formatDeadline(suspendedUntil)}\ndurée: ${formatDurationLabel(durationDays)}`;

const buildBanDetailsHtml = ({ reason, suspendedUntil, durationDays }) => `
  <p><strong>Raison :</strong> ${reason}</p>
  <p><strong>Date de retour :</strong> ${formatDeadline(suspendedUntil)}</p>
  <p><strong>Durée :</strong> ${formatDurationLabel(durationDays)}</p>
`;

const buildBanEmailPayload = ({ name, reason, suspendedUntil, durationDays }) => ({
  subject: "Votre compte Freelancy a été banni",
  text: `Bonjour ${name},\n\nVotre compte a été banni suite a un signalement verifié.\n${buildBanDetailsText({
    reason,
    suspendedUntil,
    durationDays,
  })}\n\nSi vous pensez qu'il s'agit d'une erreur, merci de contacter le support.`,
  html: `
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Votre compte Freelancy a été banni suite a un signalement verifié.</p>
    ${buildBanDetailsHtml({
      reason,
      suspendedUntil,
      durationDays,
    })}
    <p>Si vous pensez qu'il s'agit d'une erreur, merci de contacter le support.</p>
  `,
});

export const adminService = {
  async listUsers() {
    return adminRepository.listUsers();
  },

  async getUserById(userId) {
    const normalizedUserId = parsePositiveId(userId, "User id");
    const user = await adminRepository.findUserById(normalizedUserId);

    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    return user;
  },

  async getUserByEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      throw new AppError("Email utilisateur invalide.", 400, "INVALID_EMAIL");
    }

    const user = await adminRepository.findUserByEmail(normalizedEmail);

    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    return user;
  },

  async listReports() {
    return adminRepository.listReports();
  },

  async getReportById(reportId) {
    const normalizedReportId = parsePositiveId(reportId, "Report id");
    const report = await adminRepository.findReportById(normalizedReportId);

    if (!report) {
      throw new AppError("Report introuvable.", 404, "REPORT_NOT_FOUND");
    }

    return report;
  },

  async closeReport(reportId) {
    const report = await this.getReportById(reportId);

    if (report.status === "ferme") {
      if (report.reportedUserIsSuspended && !report.reportedUserEmailSentAt) {
        return adminRepository.syncReportedUserEmailSentFromBanHistory(report.id, report.reportedUserId);
      }

      return report;
    }

    return this.updateReportStatus(report.id, "ferme");
  },

  async updateReportStatus(reportId, nextStatus) {
    const report = await this.getReportById(reportId);
    const normalizedStatus = String(nextStatus || "").trim();

    if (!["en_cours", "ouvert", "ferme", "refuse"].includes(normalizedStatus)) {
      throw new AppError("Statut de signalement invalide.", 400, "INVALID_REPORT_STATUS");
    }

    if (report.status === normalizedStatus) {
      if (
        normalizedStatus === "ferme" &&
        report.reportedUserIsSuspended &&
        !report.reportedUserEmailSentAt
      ) {
        return adminRepository.syncReportedUserEmailSentFromBanHistory(report.id, report.reportedUserId);
      }

      return report;
    }

    const updatedReport = await adminRepository.updateReportStatus(report.id, normalizedStatus);

    if (
      normalizedStatus === "ferme" &&
      updatedReport.reportedUserIsSuspended &&
      !updatedReport.reportedUserEmailSentAt
    ) {
      return adminRepository.syncReportedUserEmailSentFromBanHistory(
        updatedReport.id,
        updatedReport.reportedUserId,
      );
    }

    return updatedReport;
  },

  async banUser(adminUserId, userId, payload = {}) {
    const normalizedAdminId = parsePositiveId(adminUserId, "Admin id");
    const normalizedUserId = parsePositiveId(userId, "User id");

    if (normalizedAdminId === normalizedUserId) {
      throw new AppError("Un administrateur ne peut pas se bannir lui-meme.", 400, "SELF_BAN_FORBIDDEN");
    }

    const user = await adminRepository.findUserById(normalizedUserId);
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    const reason = String(payload.reason || "").trim();
    if (!reason) {
      throw new AppError("La raison du ban est obligatoire.", 400, "BAN_REASON_REQUIRED");
    }

    const durationDays = parseDurationDays(payload.durationDays);

    const updatedUser = await adminRepository.setUserSuspendedState(normalizedUserId, {
      isSuspended: true,
      reason,
      durationDays,
    });

    const emailPayload = buildBanEmailPayload({
      name: updatedUser?.name || user.name,
      reason: updatedUser?.suspensionReason || reason,
      suspendedUntil: updatedUser?.suspendedUntil,
      durationDays: updatedUser?.suspensionDurationDays,
    });

    const banHistoryEntryId = await adminRepository.createBanHistoryEntry({
      userId: normalizedUserId,
      adminUserId: normalizedAdminId,
      reason,
      durationDays: updatedUser?.suspensionDurationDays || durationDays,
      suspendedUntil: updatedUser?.suspendedUntil || null,
      emailSubject: emailPayload.subject,
      emailText: emailPayload.text,
      emailHtml: emailPayload.html,
    });

    if (updatedUser?.email) {
      await mailer.sendMail({
        to: updatedUser.email,
        subject: emailPayload.subject,
        text: emailPayload.text,
        html: emailPayload.html,
      });

      await adminRepository.markBanHistoryEmailSent(banHistoryEntryId);
    }

    // Disconnect the banned user from all active socket connections
    disconnectUser(normalizedUserId, {
      message: `Vous avez ete banni. Raison: ${reason}`,
      suspendedUntil: updatedUser?.suspendedUntil || "",
    });

    return adminRepository.findUserById(normalizedUserId);
  },

  async deleteUser(adminUserId, userId) {
    const normalizedAdminId = parsePositiveId(adminUserId, "Admin id");
    const normalizedUserId = parsePositiveId(userId, "User id");

    if (normalizedAdminId === normalizedUserId) {
      throw new AppError(
        "Un administrateur ne peut pas supprimer son propre compte.",
        400,
        "SELF_DELETE_FORBIDDEN",
      );
    }

    const user = await adminRepository.findUserById(normalizedUserId);
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    if (String(user.role || "").toLowerCase() === "admin") {
      throw new AppError(
        "La suppression d'un compte administrateur est interdite.",
        403,
        "ADMIN_DELETE_FORBIDDEN",
      );
    }

    try {
      await adminRepository.deleteUserById(normalizedUserId);
    } catch (error) {
      if (!isForeignKeyConstraintError(error)) {
        throw error;
      }

      throw new AppError(
        "Suppression impossible: ce compte est lie a des contrats ou paiements existants.",
        409,
        "USER_DELETE_CONFLICT",
      );
    }

    return {
      id: normalizedUserId,
      deleted: true,
    };
  },

  async unbanUser(userId) {
    const normalizedUserId = parsePositiveId(userId, "User id");
    const user = await adminRepository.findUserById(normalizedUserId);
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404, "USER_NOT_FOUND");
    }

    return adminRepository.setUserSuspendedState(normalizedUserId, {
      isSuspended: false,
    });
  },

  async notifyBannedUser(reportId, payload = {}) {
    const report = await this.getReportById(reportId);

    if (!report.reportedUserIsSuspended) {
      throw new AppError(
        "Cet utilisateur n'est pas actuellement banni.",
        400,
        "USER_NOT_BANNED",
      );
    }

    const overrideReason = String(payload.reason || "").trim();
    const overrideDurationDays = parseDurationDays(payload.durationDays);
    const emailReason = overrideReason || report.banReason || report.reason;
    const emailDurationDays = overrideDurationDays || report.banDurationDays;
    const emailSuspendedUntil =
      overrideDurationDays ? computeSuspendedUntilFromDuration(overrideDurationDays) : report.bannedUntil;

    await mailer.sendMail({
      to: report.reportedUserEmail,
      subject: "Votre compte Freelancy a été banni",
      text: `Bonjour ${report.reportedUserName},\n\nVotre compte a été banni suite a un signalement verifié.\n${buildBanDetailsText({
        reason: emailReason,
        suspendedUntil: emailSuspendedUntil,
        durationDays: emailDurationDays,
      })}\n\nMerci de respecter les règles de la plateforme.`,
      html: `
        <p>Bonjour <strong>${report.reportedUserName}</strong>,</p>
        <p>Votre compte Freelancy a été banni suite a un signalement verifié.</p>
        ${buildBanDetailsHtml({
          reason: emailReason,
          suspendedUntil: emailSuspendedUntil,
          durationDays: emailDurationDays,
        })}
        <p>Merci de respecter les règles de la plateforme.</p>
      `,
    });

    await adminRepository.markLatestBanHistoryEmailSentForUser(report.reportedUserId);
    const reportWithEmailFlag = await adminRepository.markReportedUserEmailSent(report.id);
    return adminRepository.updateReportStatus(reportWithEmailFlag.id, "ferme");
  },

  async notifyReporter(reportId, outcome) {
    const report = await this.getReportById(reportId);
    const normalizedOutcome = String(outcome || "").trim();

    if (!["resolved", "not_issue"].includes(normalizedOutcome)) {
      throw new AppError("Outcome email invalide.", 400, "INVALID_OUTCOME");
    }

    const isResolved = normalizedOutcome === "resolved";

    if (isResolved && report.reportedUserIsSuspended && report.reportedUserEmail) {
      await mailer.sendMail({
        to: report.reportedUserEmail,
        subject: "Votre compte Freelancy a été banni",
        text: `Bonjour ${report.reportedUserName},\n\nVotre compte a été banni suite a un signalement verifié.\n${buildBanDetailsText({
          reason: report.banReason || report.reason,
          suspendedUntil: report.bannedUntil,
          durationDays: report.banDurationDays,
        })}\n\nMerci de respecter les règles de la plateforme.`,
        html: `
          <p>Bonjour <strong>${report.reportedUserName}</strong>,</p>
          <p>Votre compte Freelancy a été banni suite a un signalement verifié.</p>
          ${buildBanDetailsHtml({
            reason: report.banReason || report.reason,
            suspendedUntil: report.bannedUntil,
            durationDays: report.banDurationDays,
          })}
          <p>Merci de respecter les règles de la plateforme.</p>
        `,
      });

      await adminRepository.markLatestBanHistoryEmailSentForUser(report.reportedUserId);
      await adminRepository.markReportedUserEmailSent(report.id);
    }

    await mailer.sendMail({
      to: report.reporterEmail,
      subject: isResolved
        ? "Votre signalement a été traite"
        : "Retour sur votre signalement Freelancy",
      text: isResolved
        ? `Bonjour ${report.reporterName},\n\nNous avons examine votre signalement concernant ${report.reportedUserName} et nous avons resolu le probleme. Merci pour votre retour.`
        : `Bonjour ${report.reporterName},\n\nNous avons examine votre signalement concernant ${report.reportedUserName}. Apres verification, nous n'avons pas constate de probleme necessitant une action supplementaire.`,
      html: isResolved
        ? `<p>Bonjour <strong>${report.reporterName}</strong>,</p><p>Nous avons examine votre signalement concernant <strong>${report.reportedUserName}</strong> et nous avons resolu le probleme.</p><p>Merci pour votre retour.</p>`
        : `<p>Bonjour <strong>${report.reporterName}</strong>,</p><p>Nous avons examine votre signalement concernant <strong>${report.reportedUserName}</strong>.</p><p>Apres verification, nous n'avons pas constate de probleme necessitant une action supplementaire.</p>`,
    });

    return adminRepository.updateReportStatus(report.id, isResolved ? "ferme" : "refuse");
  },
};
