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

const mapReviewRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fromUserId: row.from_user_id,
    fromUserName: row.from_user_name ?? null,
    toUserId: row.to_user_id,
    score: Number(row.score),
    comment: row.comment ?? "",
    createdAt: formatTimestamp(row.created_at),
  };
};

export const ensureReviewsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      from_user_id INT NOT NULL,
      to_user_id INT NOT NULL,
      score INT NOT NULL,
      comment TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_reviews_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_to_user FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT chk_reviews_score CHECK (score BETWEEN 1 AND 5),
      CONSTRAINT chk_reviews_not_self CHECK (from_user_id <> to_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

export const reviewRepository = {
  async findByTargetUser(userId) {
    const [rows] = await db.query(
      `
        SELECT
          r.*,
          u.name AS from_user_name
        FROM reviews r
        JOIN users u ON u.id = r.from_user_id
        WHERE r.to_user_id = ?
        ORDER BY r.created_at DESC
      `,
      [userId],
    );

    return rows.map(mapReviewRow);
  },

  async findExisting(fromUserId, toUserId) {
    const [rows] = await db.query(
      "SELECT id FROM reviews WHERE from_user_id = ? AND to_user_id = ? LIMIT 1",
      [fromUserId, toUserId],
    );

    return rows[0] ?? null;
  },

  async create(data) {
    const [result] = await db.query(
      `
        INSERT INTO reviews (from_user_id, to_user_id, score, comment)
        VALUES (?, ?, ?, ?)
      `,
      [data.fromUserId, data.toUserId, data.score, data.comment || null],
    );

    const [rows] = await db.query(
      `
        SELECT
          r.*,
          u.name AS from_user_name
        FROM reviews r
        JOIN users u ON u.id = r.from_user_id
        WHERE r.id = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    return mapReviewRow(rows[0]);
  },
};
