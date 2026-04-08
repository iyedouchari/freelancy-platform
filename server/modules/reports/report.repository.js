import { getDb } from "../../config/db.js";

const db = getDb();

const formatTimestamp = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(value).toISOString();
};

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
    status: normalizeReportStatus(row.status),
    createdAt: formatTimestamp(row.created_at),
  };
};

export const reportRepository = {
  async create({ reporterId, reportedUserId, dealId, reason, details }) {
    const [result] = await db.query(
      `
        INSERT INTO reports (reporter_id, reported_user_id, deal_id, reason, details)
        VALUES (?, ?, ?, ?, ?)
      `,
      [reporterId, reportedUserId, dealId || null, reason, details || null],
    );

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
