import { getDb } from "../../config/db.js";
import { ensureReportsTable } from "../admin/admin.repository.js";

const db = getDb();
// Permet de supprimer l'index unique legacy sur deal_id et reporter_id dans la table des reports, qui posait problème pour les utilisateurs qui voulaient faire plusieurs signalements liés au même deal, en vérifiant d'abord si l'index existe, puis en le supprimant et en recréant la contrainte de clé étrangère sans l'unicité
const dropLegacyDealReporterIndex = async () => {
  const [rows] = await db.query(
    `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'reports'
        AND index_name = 'uq_reports_deal_reporter'
      LIMIT 1
    `,
  );

  if (!rows[0]) {// Si l'index n'existe pas, on considère que c'est déjà réglé et on retourne true pour continuer le processus de création du report
    return false;
  }

  const [fkRows] = await db.query(
    `
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'reports'
        AND constraint_name = 'fk_reports_deal'
      LIMIT 1
    `,
  );

  if (fkRows[0]) {
    await db.query(`
      ALTER TABLE reports
      DROP FOREIGN KEY fk_reports_deal
    `);
  }

  await db.query(`
    ALTER TABLE reports
    DROP INDEX uq_reports_deal_reporter
  `);

  await db.query(`
    ALTER TABLE reports
    ADD CONSTRAINT fk_reports_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
  `).catch(() => {});

  return true;
};

const insertReport = async ({// Permet d'insérer un nouveau signalement dans la base de données en effectuant une requête SQL d'insertion avec les informations du signalement fournies, et en retournant le résultat de l'insertion pour pouvoir récupérer l'ID généré
  reporterId,
  reportedUserId,
  dealId,
  reason,
  details,
  attachmentFileName,
  attachmentFileUrl,
  attachmentMimeType,
  attachmentSize,
}) =>
  db.query(
    `
      INSERT INTO reports (
        reporter_id,
        reported_user_id,
        deal_id,
        reason,
        details,
        attachment_file_name,
        attachment_file_url,
        attachment_mime_type,
        attachment_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      reporterId,
      reportedUserId,
      dealId || null,
      reason,
      details || null,
      attachmentFileName || null,
      attachmentFileUrl || null,
      attachmentMimeType || null,
      attachmentSize ?? null,
    ],
  );

const formatTimestamp = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(value).toISOString();
};
// Permet de normaliser le statut d'un signalement en français, en convertissant les différentes variantes possibles de statut en une valeur standardisée (ouvert, en_cours, ferme, refuse), pour faciliter la gestion des statuts dans l'application
const normalizeReportStatus = (status) => {
  if (status === "open" || status === "ouvert") {
    return "ouvert";
  }

  if (status === "reviewed" || status === "en cours" || status === "en_cours") {
    return "en_cours";
  }

  if (status === "resolved" || status === "ferme" || status === "fermé" || status === "fermÃ©") {
    return "ferme";
  }

  if (status === "refuse" || status === "refusé" || status === "refusee" || status === "refusÃ©") {
    return "refuse";
  }

  return "en_cours";
};

const mapReportRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    reporterRole: String(row.reporter_role || "").toLowerCase(),
    reportedUserId: row.reported_user_id,
    reportedUserName: row.reported_user_name,
    reportedUserRole: String(row.reported_user_role || "").toLowerCase(),
    dealId: row.deal_id ? Number(row.deal_id) : null,
    reason: row.reason,
    details: row.details || "",
    attachmentFileName: row.attachment_file_name || "",
    attachmentFileUrl: row.attachment_file_url || "",
    attachmentMimeType: row.attachment_mime_type || "",
    attachmentSize: row.attachment_size ? Number(row.attachment_size) : null,
    status: normalizeReportStatus(row.status),
    createdAt: formatTimestamp(row.created_at),
  };
};

export const reportRepository = {
  async create({
    reporterId,
    reportedUserId,
    dealId,
    reason,
    details,
    attachmentFileName,
    attachmentFileUrl,
    attachmentMimeType,
    attachmentSize,
  }) {
    await ensureReportsTable();
    let result;
// On tente d'insérer le report, mais si une erreur de contrainte d'unicité legacy est détectée, on supprime l'index problématique et on réessaie l'insertion
    try {
      [result] = await insertReport({
        reporterId,
        reportedUserId,
        dealId,
        reason,
        details,
        attachmentFileName,
        attachmentFileUrl,
        attachmentMimeType,
        attachmentSize,
      });
    } catch (error) {
      const sqlMessage = String(error?.sqlMessage || "");
      const isLegacyUniqueConstraint =
        error?.errno === 1062 &&
        (
          sqlMessage.includes("uq_reports_deal_reporter") ||
          sqlMessage.includes("reports.uq_reports_deal_reporter")
        );

      if (!isLegacyUniqueConstraint) {
        throw error;
      }

      const dropped = await dropLegacyDealReporterIndex();
      if (!dropped) {
        throw error;
      }

      [result] = await insertReport({
        reporterId,
        reportedUserId,
        dealId,
        reason,
        details,
        attachmentFileName,
        attachmentFileUrl,
        attachmentMimeType,
        attachmentSize,
      });
    }

    const [rows] = await db.query(
      `
        SELECT
          r.id,
          r.reporter_id,
          reporter.name AS reporter_name,
          reporter.role AS reporter_role,
          r.reported_user_id,
          reported.name AS reported_user_name,
          reported.role AS reported_user_role,
          r.deal_id,
          r.reason,
          r.details,
          r.attachment_file_name,
          r.attachment_file_url,
          r.attachment_mime_type,
          r.attachment_size,
          r.status,
          r.created_at
        FROM reports r
        JOIN users reporter ON reporter.id = r.reporter_id
        JOIN users reported ON reported.id = r.reported_user_id
        WHERE r.id = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    return mapReportRow(rows[0]);
  },

  async listForReporter(reporterId) {
    await ensureReportsTable();

    const [rows] = await db.query(
      `
        SELECT
          r.id,
          r.reporter_id,
          reporter.name AS reporter_name,
          reporter.role AS reporter_role,
          r.reported_user_id,
          reported.name AS reported_user_name,
          reported.role AS reported_user_role,
          r.deal_id,
          r.reason,
          r.details,
          r.attachment_file_name,
          r.attachment_file_url,
          r.attachment_mime_type,
          r.attachment_size,
          r.status,
          r.created_at
        FROM reports r
        JOIN users reporter ON reporter.id = r.reporter_id
        JOIN users reported ON reported.id = r.reported_user_id
        WHERE r.reporter_id = ?
        ORDER BY r.created_at DESC, r.id DESC
      `,
      [reporterId],
    );

    return rows.map(mapReportRow);
  },

  async findExistingOpenReport(reporterId, reportedUserId, dealId = null) {
    await ensureReportsTable();

    const [rows] = await db.query(
      `
        SELECT id
        FROM reports
        WHERE reporter_id = ?
          AND reported_user_id = ?
          AND (
            (deal_id IS NULL AND ? IS NULL)
            OR deal_id = ?
          )
          AND status IN ('en_cours', 'ouvert')
        LIMIT 1
      `,
      [reporterId, reportedUserId, dealId, dealId],
    );

    return rows[0] ?? null;
  },

};
