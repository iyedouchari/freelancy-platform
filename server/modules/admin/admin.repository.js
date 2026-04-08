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

const isStatusTruncationError = (error) =>
  error?.errno === 1265 ||
  error?.code === "WARN_DATA_TRUNCATED" ||
  String(error?.sqlMessage || error?.message || "").includes("Data truncated for column 'status'");

const normalizeReportStatus = (status) => {
  if (status === "open" || status === "ouvert") {
    return "ouvert";
  }

  if (status === "reviewed" || status === "en cours" || status === "en_cours") {
    return "en_cours";
  }

  if (status === "refuse" || status === "refusee" || status === "refusé") {
    return "refuse";
  }

  return "ferme";
};

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: String(row.role || "").toLowerCase(),
    company: row.company || "",
    title: row.professional_title || "",
    location: row.location || "",
    phone: row.phone || "",
    bio: row.bio || "",
    avatarUrl: row.avatar_url || "",
    points: Number(row.points || 0),
    isSuspended: Boolean(row.is_suspended),
    suspensionReason: row.suspension_reason || "",
    suspensionDurationDays: row.suspension_duration_days ? Number(row.suspension_duration_days) : null,
    suspendedUntil: formatTimestamp(row.suspended_until),
    createdAt: formatTimestamp(row.created_at),
    reportsReceived: Number(row.reports_received || 0),
    reportsSubmitted: Number(row.reports_submitted || 0),
    banHistory: [],
  };
};

const mapBanHistoryRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    reason: row.reason || "",
    durationDays: row.duration_days ? Number(row.duration_days) : null,
    suspendedUntil: formatTimestamp(row.suspended_until),
    createdAt: formatTimestamp(row.created_at),
  };
};

const mapReportRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    reporterEmail: row.reporter_email,
    reporterRole: String(row.reporter_role || "").toLowerCase(),
    reportedUserId: row.reported_user_id,
    reportedUserName: row.reported_user_name,
    reportedUserEmail: row.reported_user_email,
    dealId: row.deal_id ? Number(row.deal_id) : null,
    reportedUserRole: String(row.reported_user_role || "").toLowerCase(),
    reportedUserIsSuspended: Boolean(row.reported_user_is_suspended),
    banReason: row.reported_user_suspension_reason || "",
    banDurationDays: row.reported_user_suspension_duration_days
      ? Number(row.reported_user_suspension_duration_days)
      : null,
    bannedUntil: formatTimestamp(row.reported_user_suspended_until),
    reportedUserEmailSentAt: formatTimestamp(row.reported_user_email_sent_at),
    isReportedUserEmailSent: Boolean(row.reported_user_mail_sent),
    reason: row.reason,
    details: row.details || "",
    status: normalizeReportStatus(row.status),
    createdAt: formatTimestamp(row.created_at),
    closedAt: formatTimestamp(row.closed_at),
  };
};

export const ensureReportsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporter_id INT NOT NULL,
      reported_user_id INT NOT NULL,
      deal_id INT DEFAULT NULL,
      reason VARCHAR(120) NOT NULL,
      details TEXT DEFAULT NULL,
      status ENUM('ouvert', 'en_cours', 'ferme', 'refuse') NOT NULL DEFAULT 'en_cours',
      reported_user_mail_sent BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMP NULL DEFAULT NULL,
      reported_user_email_sent_at TIMESTAMP NULL DEFAULT NULL,
      CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_reports_target FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_reports_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
      CONSTRAINT chk_reports_not_self CHECK (reporter_id <> reported_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    ALTER TABLE reports
    ADD COLUMN deal_id INT NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    ADD CONSTRAINT fk_reports_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    ADD COLUMN closed_at TIMESTAMP NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    ADD COLUMN reported_user_email_sent_at TIMESTAMP NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    ADD COLUMN reported_user_mail_sent BOOLEAN NOT NULL DEFAULT FALSE
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    MODIFY COLUMN status ENUM(
      'open',
      'reviewed',
      'resolved',
      'ouvert',
      'en cours',
      'en_cours',
      'ferme',
      'fermé',
      'refuse',
      'refusee',
      'refusé'
    ) NOT NULL DEFAULT 'en_cours'
  `).catch(() => {});

  await db.query(`
    UPDATE reports
    SET reported_user_mail_sent = CASE
      WHEN reported_user_email_sent_at IS NOT NULL THEN TRUE
      ELSE reported_user_mail_sent
    END
  `).catch(() => {});

  await db.query(`
    UPDATE reports
    SET
      status = CASE
        WHEN status IN ('open', 'ouvert') THEN 'ouvert'
        WHEN status IN ('reviewed', 'en cours', 'en_cours') THEN 'en_cours'
        WHEN status IN ('resolved', 'ferme', 'fermé') THEN 'ferme'
        WHEN status IN ('refuse', 'refusee', 'refusé') THEN 'refuse'
        ELSE 'en_cours'
      END,
      closed_at = CASE
        WHEN status IN ('resolved', 'ferme', 'fermé', 'refuse', 'refusee', 'refusé') AND closed_at IS NULL
          THEN CURRENT_TIMESTAMP
        ELSE closed_at
      END
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    MODIFY COLUMN status ENUM('ouvert', 'en_cours', 'ferme', 'refuse') NOT NULL DEFAULT 'en_cours'
  `).catch(() => {});

  await db.query(`
    ALTER TABLE users
    ADD COLUMN suspension_duration_days INT NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS ban_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      admin_user_id INT NOT NULL,
      reason TEXT NOT NULL,
      duration_days INT NULL DEFAULT NULL,
      suspended_until TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_ban_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_ban_history_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const userSelect = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.company,
    u.professional_title,
    u.location,
    u.phone,
    u.bio,
    u.avatar_url,
    u.points,
    u.is_suspended,
    u.suspension_reason,
    u.suspension_duration_days,
    u.suspended_until,
    u.created_at,
    COUNT(DISTINCT received.id) AS reports_received,
    COUNT(DISTINCT submitted.id) AS reports_submitted
  FROM users u
  LEFT JOIN reports received ON received.reported_user_id = u.id
  LEFT JOIN reports submitted ON submitted.reporter_id = u.id
`;

const reportSelect = `
  SELECT
    r.id,
    r.reporter_id,
    reporter.name AS reporter_name,
    reporter.email AS reporter_email,
    reporter.role AS reporter_role,
    r.reported_user_id,
    reported.name AS reported_user_name,
    reported.email AS reported_user_email,
    r.deal_id,
    reported.role AS reported_user_role,
    reported.is_suspended AS reported_user_is_suspended,
    reported.suspension_reason AS reported_user_suspension_reason,
    reported.suspension_duration_days AS reported_user_suspension_duration_days,
    reported.suspended_until AS reported_user_suspended_until,
    r.reported_user_mail_sent,
    r.reported_user_email_sent_at,
    r.reason,
    r.details,
    r.status,
    r.created_at,
    r.closed_at
  FROM reports r
  JOIN users reporter ON reporter.id = r.reporter_id
  JOIN users reported ON reported.id = r.reported_user_id
`;

export const adminRepository = {
  async listUsers() {
    const [rows] = await db.query(`
      ${userSelect}
      GROUP BY
        u.id,
        u.name,
        u.email,
        u.role,
        u.company,
        u.professional_title,
        u.location,
        u.phone,
        u.bio,
        u.avatar_url,
        u.points,
        u.is_suspended,
        u.suspension_reason,
        u.suspension_duration_days,
        u.suspended_until,
        u.created_at
      ORDER BY u.created_at DESC, u.id DESC
    `);

    return rows.map(mapUserRow);
  },

  async findUserById(userId) {
    const [rows] = await db.query(
      `
        ${userSelect}
        WHERE u.id = ?
        GROUP BY
          u.id,
          u.name,
          u.email,
          u.role,
          u.company,
          u.professional_title,
          u.location,
          u.phone,
          u.bio,
          u.avatar_url,
          u.points,
          u.is_suspended,
          u.suspension_reason,
          u.suspension_duration_days,
          u.suspended_until,
          u.created_at
        LIMIT 1
      `,
      [userId],
    );

    const user = rows.map(mapUserRow)[0] || null;
    if (!user) {
      return null;
    }

    user.banHistory = await this.listBanHistoryForUser(userId);
    return user;
  },

  async findUserByEmail(email) {
    const [rows] = await db.query(
      `
        ${userSelect}
        WHERE LOWER(u.email) = LOWER(?)
        GROUP BY
          u.id,
          u.name,
          u.email,
          u.role,
          u.company,
          u.professional_title,
          u.location,
          u.phone,
          u.bio,
          u.avatar_url,
          u.points,
          u.is_suspended,
          u.suspension_reason,
          u.suspension_duration_days,
          u.suspended_until,
          u.created_at
        LIMIT 1
      `,
      [email],
    );

    const user = rows.map(mapUserRow)[0] || null;
    if (!user) {
      return null;
    }

    user.banHistory = await this.listBanHistoryForUser(user.id);
    return user;
  },

  async listReports() {
    const [rows] = await db.query(`
      ${reportSelect}
      ORDER BY r.created_at DESC, r.id DESC
    `);

    return rows.map(mapReportRow);
  },

  async findReportById(reportId) {
    const [rows] = await db.query(
      `
        ${reportSelect}
        WHERE r.id = ?
        LIMIT 1
      `,
      [reportId],
    );

    return rows.map(mapReportRow)[0] || null;
  },

  async updateReportStatus(reportId, status) {
    try {
      await db.query(
        `
          UPDATE reports
          SET
            status = ?,
            closed_at = CASE
              WHEN ? IN ('ferme', 'refuse') THEN CURRENT_TIMESTAMP
              ELSE NULL
            END
          WHERE id = ?
          LIMIT 1
        `,
        [status, status, reportId],
      );
    } catch (error) {
      if (!isStatusTruncationError(error)) {
        throw error;
      }

      await ensureReportsTable();

      await db.query(
        `
          UPDATE reports
          SET
            status = ?,
            closed_at = CASE
              WHEN ? IN ('ferme', 'refuse') THEN CURRENT_TIMESTAMP
              ELSE NULL
            END
          WHERE id = ?
          LIMIT 1
        `,
        [status, status, reportId],
      );
    }

    return this.findReportById(reportId);
  },

  async markReportedUserEmailSent(reportId) {
    await db.query(
      `
        UPDATE reports
        SET
          reported_user_email_sent_at = CURRENT_TIMESTAMP,
          reported_user_mail_sent = TRUE
        WHERE id = ?
        LIMIT 1
      `,
      [reportId],
    );

    return this.findReportById(reportId);
  },

  async setUserSuspendedState(userId, { isSuspended, reason = "", durationDays = null }) {
    const normalizedDurationDays =
      durationDays === null || durationDays === undefined || durationDays === ""
        ? null
        : Number.parseInt(durationDays, 10);

    const hasFiniteDuration = Number.isInteger(normalizedDurationDays) && normalizedDurationDays > 0;
    const suspendedUntil = hasFiniteDuration
      ? new Date(Date.now() + normalizedDurationDays * 24 * 60 * 60 * 1000)
      : null;

    await db.query(
      `
        UPDATE users
        SET
          is_suspended = ?,
          suspension_reason = ?,
          suspension_duration_days = ?,
          suspended_until = ?
        WHERE id = ?
        LIMIT 1
      `,
      [
        isSuspended ? 1 : 0,
        isSuspended ? reason || "Banni par l'administrateur." : null,
        isSuspended && hasFiniteDuration ? normalizedDurationDays : null,
        isSuspended ? suspendedUntil : null,
        userId,
      ],
    );

    return this.findUserById(userId);
  },

  async createBanHistoryEntry({ userId, adminUserId, reason, durationDays, suspendedUntil }) {
    await db.query(
      `
        INSERT INTO ban_history (user_id, admin_user_id, reason, duration_days, suspended_until)
        VALUES (?, ?, ?, ?, ?)
      `,
      [userId, adminUserId, reason, durationDays || null, suspendedUntil || null],
    );
  },

  async listBanHistoryForUser(userId) {
    const [rows] = await db.query(
      `
        SELECT
          id,
          admin_user_id,
          reason,
          duration_days,
          suspended_until,
          created_at
        FROM ban_history
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `,
      [userId],
    );

    return rows.map(mapBanHistoryRow);
  },
};
