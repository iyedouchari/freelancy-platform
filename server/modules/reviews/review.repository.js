import { getDb } from "../../config/db.js";

const db = getDb();

const formatTimestamp = (value) => {// Permet de formater une valeur de date en une chaîne de caractères au format ISO, en vérifiant d'abord si la valeur est nulle ou vide, puis en la convertissant en objet Date si nécessaire, et enfin en retournant la représentation ISO de la date
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(value).toISOString();
};

const mapReviewRow = (row) => {// Permet de mapper une ligne de résultat de la base de données en un objet de revue avec les champs correctement formatés, en vérifiant d'abord si la ligne est nulle, puis en extrayant les champs nécessaires et en formatant les dates
  if (!row) {
    return null;
  }

  return {// On mappe les champs de la ligne de la base de données aux champs de l'objet de revue, en utilisant des noms de champs plus conviviaux et en formatant les dates au format ISO
    id: row.id,
    dealId: row.deal_id,
    fromUserId: row.from_user_id,
    fromUserName: row.from_user_name ?? null,
    fromUserAvatarUrl: row.from_user_avatar_url ?? null,
    toUserId: row.to_user_id,
    score: Number(row.score),
    comment: row.comment ?? "",
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
  };
};

export const ensureReviewsTable = async () => {// Permet de s'assurer que la table des avis existe dans la base de données, et qu'elle a les colonnes nécessaires pour stocker les informations des avis, en créant la table si elle n'existe pas, et en ajout
  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deal_id INT NULL,
      from_user_id INT NOT NULL,
      to_user_id INT NOT NULL,
      score INT NOT NULL,
      comment TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT uq_reviews_deal_from_user UNIQUE (deal_id, from_user_id),
      CONSTRAINT fk_reviews_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_to_user FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT chk_reviews_score CHECK (score BETWEEN 1 AND 5),
      CONSTRAINT chk_reviews_not_self CHECK (from_user_id <> to_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const addColumnIfMissing = async (columnName, columnDefinition) => {
    const [rows] = await db.query("SHOW COLUMNS FROM reviews LIKE ?", [columnName]);
    if (rows.length === 0) {
      await db.query(`ALTER TABLE reviews ADD COLUMN ${columnDefinition}`);
    }
  };

  await addColumnIfMissing("deal_id", "deal_id INT NOT NULL AFTER id");
  await db.query("ALTER TABLE reviews MODIFY COLUMN deal_id INT NULL");
  await addColumnIfMissing(
    "updated_at",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
  );
// On s'assure que l'index unique sur deal_id et from_user_id existe pour éviter les doublons liés au même deal et au même auteur, puis on nettoie les doublons historiques et on ajoute une contrainte d'unicité sur le couple from_user_id et to_user_id pour garantir qu'un utilisateur ne peut laisser qu'un seul avis par cible
  const [existingIndexes] = await db.query("SHOW INDEX FROM reviews WHERE Key_name = 'uq_reviews_deal_from_user'");
  if (existingIndexes.length === 0) {
    await db.query("ALTER TABLE reviews ADD UNIQUE KEY uq_reviews_deal_from_user (deal_id, from_user_id)");
  }

  // Cleanup historical duplicates and enforce one feedback per author-target pair.
  await db.query(`
    DELETE r1 FROM reviews r1
    JOIN reviews r2
      ON r1.from_user_id = r2.from_user_id
     AND r1.to_user_id = r2.to_user_id
     AND (
       COALESCE(r1.updated_at, r1.created_at) < COALESCE(r2.updated_at, r2.created_at)
       OR (
         COALESCE(r1.updated_at, r1.created_at) = COALESCE(r2.updated_at, r2.created_at)
         AND r1.id < r2.id
       )
     )
  `);

  const [legacyUniqueIndexes] = await db.query("SHOW INDEX FROM reviews WHERE Key_name = 'uq_reviews_deal_from_user'");
  if (legacyUniqueIndexes.length > 0) {
    await db.query("ALTER TABLE reviews DROP INDEX uq_reviews_deal_from_user");
  }

  const [authorTargetIndexes] = await db.query("SHOW INDEX FROM reviews WHERE Key_name = 'uq_reviews_from_to_user'");
  if (authorTargetIndexes.length === 0) {
    await db.query("ALTER TABLE reviews ADD UNIQUE KEY uq_reviews_from_to_user (from_user_id, to_user_id)");
  }
};

export const reviewRepository = {
  async findByTargetUser(userId) {
    const [rows] = await db.query(
      `
        SELECT
          r.id,
          r.deal_id,
          r.from_user_id,
          r.to_user_id,
          r.score,
          r.comment,
          r.created_at,
          r.updated_at,
          u.name AS from_user_name,
          u.avatar_url AS from_user_avatar_url
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
      `
        SELECT
          r.*,
          u.name AS from_user_name,
          u.avatar_url AS from_user_avatar_url
        FROM reviews r
        JOIN users u ON u.id = r.from_user_id
        WHERE r.from_user_id = ? AND r.to_user_id = ?
        LIMIT 1
      `,
      [fromUserId, toUserId],
    );

    return mapReviewRow(rows[0]);
  },

  async findByDealAndAuthor(dealId, fromUserId) {
    const [rows] = await db.query(
      `
        SELECT
          r.*,
          u.name AS from_user_name,
          u.avatar_url AS from_user_avatar_url
        FROM reviews r
        JOIN users u ON u.id = r.from_user_id
        WHERE r.deal_id = ? AND r.from_user_id = ?
        LIMIT 1
      `,
      [dealId, fromUserId],
    );

    return mapReviewRow(rows[0]);
  },

  async create(data) {
    const [result] = await db.query(
      `
        INSERT INTO reviews (deal_id, from_user_id, to_user_id, score, comment)
        VALUES (?, ?, ?, ?, ?)
      `,
      [data.dealId ?? null, data.fromUserId, data.toUserId, data.score, data.comment || null],
    );

    const [rows] = await db.query(
      `
        SELECT
          r.*,
          u.name AS from_user_name,
          u.avatar_url AS from_user_avatar_url
        FROM reviews r
        JOIN users u ON u.id = r.from_user_id
        WHERE r.id = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    return mapReviewRow(rows[0]);
  },

  async update(reviewId, data) {
    await db.query(
      `
        UPDATE reviews
        SET score = ?, comment = ?
        WHERE id = ?
      `,
      [data.score, data.comment || null, reviewId],
    );

    const [rows] = await db.query(
      `
        SELECT
          r.*,
          u.name AS from_user_name,
          u.avatar_url AS from_user_avatar_url
        FROM reviews r
        JOIN users u ON u.id = r.from_user_id
        WHERE r.id = ?
        LIMIT 1
      `,
      [reviewId],
    );

    return mapReviewRow(rows[0]);
  },

  async findById(reviewId) {
    const [rows] = await db.query(
      `
        SELECT *
        FROM reviews
        WHERE id = ?
        LIMIT 1
      `,
      [reviewId],
    );

    return rows[0] || null;
  },

  async delete(reviewId) {
    await db.query(
      `
        DELETE FROM reviews
        WHERE id = ?
      `,
      [reviewId],
    );
  },
};
