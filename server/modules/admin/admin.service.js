import AppError from "../../utils/AppError.js";
import { mailer } from "../../utils/mailer.js";
import { adminRepository } from "./admin.repository.js";

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
    throw new AppError("La duree du ban doit etre un nombre positif de jours.", 400, "INVALID_BAN_DURATION");
  }

  return parsed;
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
    return "duree non definie";
  }

  return `${days} jour${days > 1 ? "s" : ""}`;
};

const buildBanDetailsText = ({ reason, suspendedUntil, durationDays }) =>
  `Raison: ${reason}\nDate de retour: ${formatDeadline(suspendedUntil)}\nDuree: ${formatDurationLabel(durationDays)}`;

const buildBanDetailsHtml = ({ reason, suspendedUntil, durationDays }) => `
  <p><strong>Raison :</strong> ${reason}</p>
  <p><strong>Date de retour :</strong> ${formatDeadline(suspendedUntil)}</p>
  <p><strong>Duree :</strong> ${formatDurationLabel(durationDays)}</p>
`;

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
      return report;
    }

    return adminRepository.updateReportStatus(report.id, "ferme");
  },

  async updateReportStatus(reportId, nextStatus) {
    const report = await this.getReportById(reportId);
    const normalizedStatus = String(nextStatus || "").trim();

    if (!["en_cours", "ouvert", "ferme", "refuse"].includes(normalizedStatus)) {
      throw new AppError("Statut de signalement invalide.", 400, "INVALID_REPORT_STATUS");
    }

    if (report.status === normalizedStatus) {
      return report;
    }

    return adminRepository.updateReportStatus(report.id, normalizedStatus);
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

    await adminRepository.createBanHistoryEntry({
      userId: normalizedUserId,
      adminUserId: normalizedAdminId,
      reason,
      durationDays: updatedUser?.suspensionDurationDays || durationDays,
      suspendedUntil: updatedUser?.suspendedUntil || null,
    });

    if (updatedUser?.email) {
      await mailer.sendMail({
        to: updatedUser.email,
        subject: "Votre compte Freelancy a ete banni",
        text: `Bonjour ${updatedUser.name},\n\nVotre compte a ete banni.\n${buildBanDetailsText({
          reason: updatedUser.suspensionReason || reason,
          suspendedUntil: updatedUser.suspendedUntil,
          durationDays: updatedUser.suspensionDurationDays,
        })}\n\nSi vous pensez qu'il s'agit d'une erreur, merci de contacter le support.`,
        html: `
          <p>Bonjour <strong>${updatedUser.name}</strong>,</p>
          <p>Votre compte Freelancy a ete banni.</p>
          ${buildBanDetailsHtml({
            reason: updatedUser.suspensionReason || reason,
            suspendedUntil: updatedUser.suspendedUntil,
            durationDays: updatedUser.suspensionDurationDays,
          })}
          <p>Si vous pensez qu'il s'agit d'une erreur, merci de contacter le support.</p>
        `,
      });
    }

    return updatedUser;
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

  async notifyBannedUser(reportId) {
    const report = await this.getReportById(reportId);

    if (!report.reportedUserIsSuspended) {
      throw new AppError(
        "Cet utilisateur n'est pas actuellement banni.",
        400,
        "USER_NOT_BANNED",
      );
    }

    await mailer.sendMail({
      to: report.reportedUserEmail,
      subject: "Votre compte Freelancy a ete suspendu",
      text: `Bonjour ${report.reportedUserName},\n\nVotre compte a ete suspendu.\n${buildBanDetailsText({
        reason: report.banReason || report.reason,
        suspendedUntil: report.bannedUntil,
        durationDays: report.banDurationDays,
      })}\n\nMerci de respecter les regles de la plateforme.`,
      html: `
        <p>Bonjour <strong>${report.reportedUserName}</strong>,</p>
        <p>Votre compte Freelancy a ete suspendu.</p>
        ${buildBanDetailsHtml({
          reason: report.banReason || report.reason,
          suspendedUntil: report.bannedUntil,
          durationDays: report.banDurationDays,
        })}
        <p>Merci de respecter les regles de la plateforme.</p>
      `,
    });

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
        subject: "Votre compte Freelancy a ete banni",
        text: `Bonjour ${report.reportedUserName},\n\nVotre compte a ete banni suite a un signalement verifie.\n${buildBanDetailsText({
          reason: report.banReason || report.reason,
          suspendedUntil: report.bannedUntil,
          durationDays: report.banDurationDays,
        })}\n\nMerci de respecter les regles de la plateforme.`,
        html: `
          <p>Bonjour <strong>${report.reportedUserName}</strong>,</p>
          <p>Votre compte Freelancy a ete banni suite a un signalement verifie.</p>
          ${buildBanDetailsHtml({
            reason: report.banReason || report.reason,
            suspendedUntil: report.bannedUntil,
            durationDays: report.banDurationDays,
          })}
          <p>Merci de respecter les regles de la plateforme.</p>
        `,
      });

      await adminRepository.markReportedUserEmailSent(report.id);
    }

    await mailer.sendMail({
      to: report.reporterEmail,
      subject: isResolved
        ? "Votre signalement a ete traite"
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
