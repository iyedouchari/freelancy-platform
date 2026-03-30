import pool from "../../config/db.js";

export const requestRepository = {
  // Créer une demande
  async create(clientId, data) {
    const {
      title,
      description,
      category,
      subcategory,
      budget_min,
      budget_max,
      budget_type,
      deadline,
      skills_required,
      attachments,
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO requests 
        (client_id, title, description, category, subcategory, budget_min, budget_max, 
         budget_type, deadline, skills_required, attachments, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'open')
       RETURNING *`,
      [
        clientId,
        title,
        description,
        category,
        subcategory ?? null,
        budget_min ?? null,
        budget_max ?? null,
        budget_type ?? "fixed",
        deadline ?? null,
        skills_required ? JSON.stringify(skills_required) : null,
        attachments ? JSON.stringify(attachments) : null,
      ]
    );

    return rows[0];
  },

  // Trouver une demande par ID
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT r.*, 
              u.full_name AS client_name, 
              u.avatar_url AS client_avatar,
              u.rating AS client_rating,
              COUNT(DISTINCT p.id) AS proposals_count
       FROM requests r
       JOIN users u ON u.id = r.client_id
       LEFT JOIN proposals p ON p.request_id = r.id
       WHERE r.id = $1
       GROUP BY r.id, u.full_name, u.avatar_url, u.rating`,
      [id]
    );

    return rows[0] || null;
  },

  // Lister les demandes avec filtres + pagination
  async findAll({
    page,
    limit,
    category,
    status,
    budget_min,
    budget_max,
    search,
    sort,
    order,
  }) {
    const offset = (page - 1) * limit;
    const conditions = ["r.deleted_at IS NULL"];
    const values = [];
    let idx = 1;

    if (category) {
      conditions.push(`r.category = $${idx++}`);
      values.push(category);
    }

    if (status) {
      conditions.push(`r.status = $${idx++}`);
      values.push(status);
    }

    if (budget_min) {
      conditions.push(`r.budget_max >= $${idx++}`);
      values.push(budget_min);
    }

    if (budget_max) {
      conditions.push(`r.budget_min <= $${idx++}`);
      values.push(budget_max);
    }

    if (search) {
      conditions.push(`(r.title ILIKE $${idx} OR r.description ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const allowedSort = {
      created_at: "r.created_at",
      budget_max: "r.budget_max",
      deadline: "r.deadline",
    };

    const orderBy = `${
      allowedSort[sort] || "r.created_at"
    } ${order === "asc" ? "ASC" : "DESC"}`;

    const countQuery = `SELECT COUNT(*) FROM requests r ${where}`;

    const dataQuery = `
      SELECT r.id, r.title, r.category, r.subcategory, r.budget_min, r.budget_max,
             r.budget_type, r.deadline, r.status, r.skills_required, r.created_at,
             u.full_name AS client_name, u.avatar_url AS client_avatar,
             COUNT(DISTINCT p.id) AS proposals_count
      FROM requests r
      JOIN users u ON u.id = r.client_id
      LEFT JOIN proposals p ON p.request_id = r.id
      ${where}
      GROUP BY r.id, u.full_name, u.avatar_url
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, [...values, limit, offset]),
    ]);

    return {
      total: parseInt(countResult.rows[0].count),
      rows: dataResult.rows,
    };
  },

  // Demandes d'un client spécifique
  async findByClientId(clientId, { page, limit }) {
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT r.*, COUNT(DISTINCT p.id) AS proposals_count
       FROM requests r
       LEFT JOIN proposals p ON p.request_id = r.id
       WHERE r.client_id = $1 AND r.deleted_at IS NULL
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset]
    );

    return rows;
  },

  // Mettre à jour une demande
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      "title",
      "description",
      "category",
      "subcategory",
      "budget_min",
      "budget_max",
      "budget_type",
      "deadline",
      "skills_required",
      "status",
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(
          ["skills_required", "attachments"].includes(key) &&
            Array.isArray(data[key])
            ? JSON.stringify(data[key])
            : data[key]
        );
      }
    }

    if (!fields.length) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE requests SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    return rows[0] || null;
  },

  // Soft delete
  async softDelete(id) {
    const { rows } = await pool.query(
      `UPDATE requests 
       SET deleted_at = NOW(), status = 'cancelled' 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );

    return rows[0] || null;
  },

  // Vérifier propriétaire
  async isOwner(requestId, clientId) {
    const { rows } = await pool.query(
      `SELECT id 
       FROM requests 
       WHERE id = $1 AND client_id = $2 AND deleted_at IS NULL`,
      [requestId, clientId]
    );

    return rows.length > 0;
  },
};