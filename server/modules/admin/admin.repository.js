import { getDb } from "../../config/db.js";


const db = getDb();
let ensureReportsTablePromise;
const constraintExists = async (tableName, constraintName) => {
  const [rows] = await db.query(
    `
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND constraint_name = ?
      LIMIT 1
    `,
    [tableName, constraintName],
  );

  return Boolean(rows[0]);
};
// Permet de vérifier si un index existe avant de tenter de le supprimer, afin d'éviter les erreurs lors de la mise à jour de la table des signalements
const dropIndexIfExists = async (tableName, indexName) => {
  const [rows] = await db.query(
    `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      LIMIT 1
    `,
    [tableName, indexName],
  );

  if (!rows[0]) {// L'index n'existe pas, on peut simplement retourner sans faire de requête de suppression
    return;
  }

  await db.query(`
    ALTER TABLE ${tableName}
    DROP INDEX ${indexName}
  `);
};
// Permet de vérifier si une contrainte d'unicité sur deal_id et reporter_id existe dans la table des signalements, et de la supprimer si c'est le cas, afin d'éviter les erreurs lors de la mise à jour de la table des signalements
const dropReportsDealReporterUniqueConstraint = async () => {
  const hasUniqueIndex = await (async () => {
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

    return Boolean(rows[0]);
  })();

  if (!hasUniqueIndex) {
    return;
  }

  const hasDealForeignKey = await constraintExists("reports", "fk_reports_deal");

  if (hasDealForeignKey) {
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
};

const formatTimestamp = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(value).toISOString();
};
// Permet de récupérer la liste de tous les utilisateurs
const toDatabaseDateTime = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};
// Permet de récupérer les détails d'un utilisateur par son ID
const isStatusTruncationError = (error) =>
  error?.errno === 1265 ||
  error?.code === "WARN_DATA_TRUNCATED" ||
  String(error?.sqlMessage || error?.message || "").includes("Data truncated for column 'status'");
// Permet de récupérer les détails d'un utilisateur par son email
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
// Permet de récupérer la liste de tous les signalements
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
    emailSubject: row.email_subject || "",
    emailText: row.email_text || "",
    emailHtml: row.email_html || "",
    emailSentAt: formatTimestamp(row.email_sent_at),
    createdAt: formatTimestamp(row.created_at),
  };
};
// Permet de récupérer les détails d'un signalement par son ID
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
    attachmentFileName: row.attachment_file_name || "",
    attachmentFileUrl: row.attachment_file_url || "",
    attachmentMimeType: row.attachment_mime_type || "",
    attachmentSize: row.attachment_size ? Number(row.attachment_size) : null,
    status: normalizeReportStatus(row.status),
    createdAt: formatTimestamp(row.created_at),
    closedAt: formatTimestamp(row.closed_at),
  };
};
// Permet de vérifier si la table des signalements existe et de la créer si ce n'est pas le cas
export const ensureReportsTable = async () => {
  if (ensureReportsTablePromise) {
    return ensureReportsTablePromise;
  }

  ensureReportsTablePromise = (async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporter_id INT NOT NULL,
      reported_user_id INT NOT NULL,
      deal_id INT DEFAULT NULL,
      reason VARCHAR(120) NOT NULL,
      details TEXT DEFAULT NULL,
      attachment_file_name VARCHAR(255) DEFAULT NULL,
      attachment_file_url VARCHAR(1024) DEFAULT NULL,
      attachment_mime_type VARCHAR(255) DEFAULT NULL,
      attachment_size BIGINT DEFAULT NULL,
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
    DROP INDEX uq_reports_deal_id
  `).catch(() => {});

  await dropReportsDealReporterUniqueConstraint().catch(() => {});

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
    ADD COLUMN attachment_file_name VARCHAR(255) NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    ADD COLUMN attachment_file_url VARCHAR(1024) NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    ADD COLUMN attachment_mime_type VARCHAR(255) NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE reports
    ADD COLUMN attachment_size BIGINT NULL DEFAULT NULL
  `).catch(() => {});
// Permet de mettre à jour la colonne status pour utiliser les nouvelles valeurs normalisées, et de fermer les signalements qui étaient dans un état considéré comme fermé ou refusé
// (ex: "ferme", "fermé", "refuse", "refusé", etc.) en mettant à jour la date de fermeture 
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
      email_subject VARCHAR(255) NULL DEFAULT NULL,
      email_text TEXT NULL DEFAULT NULL,
      email_html LONGTEXT NULL DEFAULT NULL,
      email_sent_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_ban_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_ban_history_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    ALTER TABLE ban_history
    ADD COLUMN email_subject VARCHAR(255) NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE ban_history
    ADD COLUMN email_text TEXT NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE ban_history
    ADD COLUMN email_html LONGTEXT NULL DEFAULT NULL
  `).catch(() => {});

  await db.query(`
    ALTER TABLE ban_history
    ADD COLUMN email_sent_at TIMESTAMP NULL DEFAULT NULL
  `).catch(() => {});
  })().catch((error) => {
    ensureReportsTablePromise = null;
    throw error;
  });

  return ensureReportsTablePromise;
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
    r.attachment_file_name,
    r.attachment_file_url,
    r.attachment_mime_type,
    r.attachment_size,
    r.status,
    r.created_at,
    r.closed_at
  FROM reports r
  JOIN users reporter ON reporter.id = r.reporter_id
  JOIN users reported ON reported.id = r.reported_user_id
`;

export const adminRepository = {
  async listUsers() {
    await ensureReportsTable();

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
    await ensureReportsTable();

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
    await ensureReportsTable();

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
    await ensureReportsTable();

    const [rows] = await db.query(`
      ${reportSelect}
      ORDER BY r.created_at DESC, r.id DESC
    `);

    return rows.map(mapReportRow);
  },
// Permet de récupérer les détails d'un signalement par son ID
  async findReportById(reportId) {
    await ensureReportsTable();

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
// Permet de fermer un signalement
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
// Permet de bannir un utilisateur
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

  async syncReportedUserEmailSentFromBanHistory(reportId, userId) {
    const [rows] = await db.query(
      `
        SELECT email_sent_at
        FROM ban_history
        WHERE user_id = ?
          AND email_sent_at IS NOT NULL
        ORDER BY email_sent_at DESC, id DESC
        LIMIT 1
      `,
      [userId],
    );

    const latestEmailSentAt = rows[0]?.email_sent_at || null;
// Si aucune date d'envoi d'email n'est trouvée dans l'historique des bans, on ne met pas à jour la table des signalements pour éviter d'écraser une éventuelle date d'envoi déjà présente
    if (!latestEmailSentAt) {
      return this.findReportById(reportId);
    }

    await db.query(
      `
        UPDATE reports
        SET
          reported_user_email_sent_at = COALESCE(reported_user_email_sent_at, ?),
          reported_user_mail_sent = TRUE
        WHERE id = ?
        LIMIT 1
      `,
      [latestEmailSentAt, reportId],
    );

    return this.findReportById(reportId);
  },
// Permet de mettre à jour le statut d'un signalement (ex: en cours, résolu, etc.)
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
// Permet de débannir un utilisateur
  async createBanHistoryEntry({
    userId,
    adminUserId,
    reason,
    durationDays,
    suspendedUntil,
    emailSubject = null,
    emailText = null,
    emailHtml = null,
    emailSentAt = null,
  }) {
    const [result] = await db.query(
      `
        INSERT INTO ban_history (
          user_id,
          admin_user_id,
          reason,
          duration_days,
          suspended_until,
          email_subject,
          email_text,
          email_html,
          email_sent_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        adminUserId,
        reason,
        durationDays || null,
        toDatabaseDateTime(suspendedUntil),
        emailSubject || null,
        emailText || null,
        emailHtml || null,
        toDatabaseDateTime(emailSentAt),
      ],
    );

    return result.insertId;
  },

  async deleteUserById(userId) {
    await db.query(
      `
        DELETE FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId],
    );
  },
// Permet de notifier un utilisateur banni par email
  async markBanHistoryEmailSent(entryId, emailSentAt = new Date()) {
    await db.query(
      `
        UPDATE ban_history
        SET email_sent_at = ?
        WHERE id = ?
        LIMIT 1
      `,
      [toDatabaseDateTime(emailSentAt), entryId],
    );
  },

  async markLatestBanHistoryEmailSentForUser(userId, emailSentAt = new Date()) {
    await db.query(
      `
        UPDATE ban_history
        SET email_sent_at = ?
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [toDatabaseDateTime(emailSentAt), userId],
    );
  },
// Permet de récupérer l'historique des bans d'un utilisateur
  async listBanHistoryForUser(userId) {
    const [rows] = await db.query(
      `
        SELECT
          id,
          admin_user_id,
          reason,
          duration_days,
          suspended_until,
          email_subject,
          email_text,
          email_html,
          email_sent_at,
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
