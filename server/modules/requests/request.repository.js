import { getDb } from "../../config/db.js";

const db = getDb();
const KNOWN_DOMAINS = new Set([
  "Développement Web",
  "Développement Mobile",
  "Cybersécurité",
  "UI/UX Design",
  "Intelligence Artificielle & Machine Learning",
  "Cloud & DevOps",
  "Data Science",
  "Analyse de données avancée",
  "Blockchain / Web3",
  "Systèmes embarqués / IoT",
  "Jeu vidéo",
  "Design graphique",
  "Motion design",
  "Montage vidéo",
  "Modélisation 3D",
  "Production musicale",
  "Création de contenu",
  "Marketing digital",
  "Gestion des réseaux sociaux",
  "Business & support",
  "Comptabilité & finance",
  "Coaching professionnel",
  "E-commerce",
  "Dropshipping",
]);

const addColumnIfMissing = async (tableName, columnName, columnDefinition) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);

  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
};

const normalizeTimestamp = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(value).toISOString();
};

const formatDateForMySQL = (dateValue, withTime = false) => {
  if (!dateValue) {
    return null;
  }

  let date;
  if (typeof dateValue === "string") {
    // Se é uma string no formato YYYY-MM-DD ou similar, extrair apenas a data
    const dateOnly = dateValue.split(" ")[0].split("T")[0];
    date = new Date(dateOnly);
  } else {
    date = new Date(dateValue);
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (!withTime) {
    return `${year}-${month}-${day}`;
  }

  // Com time: adicionar 23:59:59 para o final do dia
  return `${year}-${month}-${day} 23:59:59`;
};

const parseSkills = (rawValue) => {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseDomains = (rawValue, fallbackDomain, rawSkills) => {
  const parsed = parseSkills(rawValue);
  if (parsed.length > 0) {
    return parsed;
  }

  const fallback = new Set();
  if (fallbackDomain) {
    fallback.add(fallbackDomain);
  }

  parseSkills(rawSkills).forEach((item) => {
    if (KNOWN_DOMAINS.has(item)) {
      fallback.add(item);
    }
  });

  return [...fallback];
};

const mapProposalRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.proposal_id,
    freelancerId: row.proposal_freelancer_id,
    freelancerName: row.proposal_freelancer_name,
    title: row.proposal_freelancer_title ?? "",
    rating: row.proposal_freelancer_rating ?? 0,
    rate: Number(row.proposal_price),
    proposedPrice: Number(row.proposal_price),
    proposedDeadline: normalizeDate(row.proposal_deadline),
    deliveryDays: row.proposal_deadline
      ? Math.max(
          0,
          Math.ceil(
            (new Date(normalizeDate(row.proposal_deadline)) - new Date(normalizeDate(row.request_deadline))) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null,
    summary: row.proposal_cover_letter ?? "",
    coverLetter: row.proposal_cover_letter ?? "",
    status: row.proposal_status,
    createdAt: normalizeTimestamp(row.proposal_created_at),
  };
};

const mapRequestRow = (row) => {
  if (!row) {
    return null;
  }

  const rawClientName =
    row.client_name && row.client_name.trim()
      ? row.client_name
      : row.client_company && row.client_company.trim()
        ? row.client_company
        : "";
  const clientName = rawClientName || "Client privé";
  const clientAvatarUrl = row.client_avatar_url && row.client_avatar_url.trim() ? row.client_avatar_url : null;

  return {
    id: row.id,
    clientId: row.client_id,
    clientName: clientName,
    clientAvatarUrl: clientAvatarUrl,
    title: row.title,
    description: row.description,
    domain: row.domain,
    category: row.domain,
    budget: Number(row.budget),
    negotiable: Boolean(row.negotiable),
    deadline: normalizeDate(row.deadline),
    status: row.status,
    postedAt: normalizeDate(row.created_at),
    createdAt: normalizeTimestamp(row.created_at),
    domains: parseDomains(row.domains_json, row.domain, row.skills_json),
    skills: parseSkills(row.skills_json),
    proposals: [],
  };
};

const enrichRequestsWithProposals = async (requests, connection = db) => {
  if (!requests.length) {
    return requests;
  }

  const requestIds = requests.map((request) => request.id);
  const placeholders = requestIds.map(() => "?").join(", ");
  const [proposalRows] = await connection.query(
    `
      SELECT
        p.id AS proposal_id,
        p.request_id,
        p.freelancer_id AS proposal_freelancer_id,
        u.name AS proposal_freelancer_name,
        u.professional_title AS proposal_freelancer_title,
        0 AS proposal_freelancer_rating,
        p.proposed_price AS proposal_price,
        p.proposed_deadline_at AS proposal_deadline,
        p.cover_letter AS proposal_cover_letter,
        p.status AS proposal_status,
        p.created_at AS proposal_created_at,
        r.deadline AS request_deadline
      FROM proposals p
      JOIN users u ON u.id = p.freelancer_id
      JOIN requests r ON r.id = p.request_id
      WHERE p.request_id IN (${placeholders})
      ORDER BY p.created_at DESC
    `,
    requestIds,
  );

  const proposalsByRequestId = new Map();

  for (const row of proposalRows) {
    const current = proposalsByRequestId.get(row.request_id) ?? [];
    current.push(mapProposalRow(row));
    proposalsByRequestId.set(row.request_id, current);
  }

  return requests.map((request) => ({
    ...request,
    proposals: proposalsByRequestId.get(request.id) ?? [],
  }));
};

export const ensureRequestsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      domain VARCHAR(100) NOT NULL,
      budget DECIMAL(15,2) NOT NULL,
      negotiable BOOLEAN NOT NULL DEFAULT TRUE,
      deadline DATE DEFAULT NULL,
      status ENUM('Ouverte','En cours','Fermee') NOT NULL DEFAULT 'Ouverte',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_req_client FOREIGN KEY (client_id)
        REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT chk_budget CHECK (budget > 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS freelancer_domains (
      id_freelancer INT NOT NULL,
      domain VARCHAR(50) NOT NULL,
      PRIMARY KEY (id_freelancer, domain),
      CONSTRAINT fk_fd_user FOREIGN KEY (id_freelancer)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await addColumnIfMissing(
    "requests",
    "skills_json",
    "skills_json JSON DEFAULT NULL AFTER deadline",
  );
  await addColumnIfMissing(
    "requests",
    "domains_json",
    "domains_json JSON DEFAULT NULL AFTER skills_json",
  );
};

export const requestRepository = {
  async create(data, connection = db) {
    const [result] = await connection.query(
      `
        INSERT INTO requests (
          client_id,
          title,
          description,
          domain,
          budget,
          negotiable,
          deadline,
          skills_json,
          domains_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.client_id,
        data.title.trim(),
        data.description.trim(),
        (data.domain ?? data.category ?? "").trim(),
        Number(data.budget),
        Boolean(data.negotiable),
        formatDateForMySQL(data.deadline, false),
        JSON.stringify(Array.isArray(data.skills) ? data.skills : []),
        JSON.stringify(Array.isArray(data.domains) ? data.domains : []),
      ],
    );

    return result.insertId;
  },

  async findById(id, connection = db) {
    const [rows] = await connection.query(
      `
        SELECT 
          r.*,
          u.name AS client_name,
          u.company AS client_company,
          u.avatar_url AS client_avatar_url
        FROM requests r
        LEFT JOIN users u ON u.id = r.client_id
        WHERE r.id = ? 
        LIMIT 1
      `, 
      [id]
    );
    const mapped = mapRequestRow(rows[0]);

    if (!mapped) {
      return null;
    }

    const [enriched] = await enrichRequestsWithProposals([mapped], connection);
    return enriched ?? null;
  },

  async findAll(filters, connection = db) {
    const {
      domain,
      status,
      minBudget,
      maxBudget,
      negotiable,
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = filters;

    const whereClauses = [];
    const params = [];

    if (domain) {
      whereClauses.push("domain = ?");
      params.push(domain);
    }

    if (status) {
      whereClauses.push("status = ?");
      params.push(status);
    }

    if (minBudget !== undefined) {
      whereClauses.push("budget >= ?");
      params.push(Number(minBudget));
    }

    if (maxBudget !== undefined) {
      whereClauses.push("budget <= ?");
      params.push(Number(maxBudget));
    }

    if (negotiable !== undefined) {
      whereClauses.push("negotiable = ?");
      params.push(Boolean(negotiable));
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const offset = (page - 1) * limit;
    const safeSortBy = ["created_at", "budget", "deadline"].includes(sortBy) ? sortBy : "created_at";
    const safeSortOrder = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM requests ${whereSql}`,
      params,
    );
    const [rows] = await connection.query(
      `
        SELECT 
          r.*,
          u.name AS client_name,
          u.company AS client_company,
          u.avatar_url AS client_avatar_url
        FROM requests r
        LEFT JOIN users u ON u.id = r.client_id
        ${whereSql}
        ORDER BY r.${safeSortBy} ${safeSortOrder}
        LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)],
    );

    const enrichedRows = await enrichRequestsWithProposals(rows.map(mapRequestRow), connection);

    return {
      rows: enrichedRows,
      total: Number(countRows[0]?.total ?? 0),
    };
  },

  async findByClientId(clientId, { page = 1, limit = 10 } = {}, connection = db) {
    const offset = (page - 1) * limit;
    const [countRows] = await connection.query(
      "SELECT COUNT(*) AS total FROM requests WHERE client_id = ?",
      [clientId],
    );
    const [rows] = await connection.query(
      `
        SELECT 
          r.*,
          u.name AS client_name,
          u.company AS client_company,
          u.avatar_url AS client_avatar_url
        FROM requests r
        LEFT JOIN users u ON u.id = r.client_id
        WHERE r.client_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [clientId, Number(limit), Number(offset)],
    );

    const enrichedRows = await enrichRequestsWithProposals(rows.map(mapRequestRow), connection);

    return {
      rows: enrichedRows,
      total: Number(countRows[0]?.total ?? 0),
    };
  },

  async update(id, data, connection = db) {
    const fields = [];
    const params = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title.trim());
    }

    if (data.description !== undefined) {
      fields.push("description = ?");
      params.push(data.description.trim());
    }

    if (data.domain !== undefined || data.category !== undefined) {
      fields.push("domain = ?");
      params.push((data.domain ?? data.category ?? "").trim());
    }

    if (data.budget !== undefined) {
      fields.push("budget = ?");
      params.push(Number(data.budget));
    }

    if (data.negotiable !== undefined) {
      fields.push("negotiable = ?");
      params.push(Boolean(data.negotiable));
    }

    if (data.deadline !== undefined) {
      fields.push("deadline = ?");
      params.push(formatDateForMySQL(data.deadline, false));
    }

    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (data.skills !== undefined) {
      fields.push("skills_json = ?");
      params.push(JSON.stringify(Array.isArray(data.skills) ? data.skills : []));
    }

    if (data.domains !== undefined) {
      fields.push("domains_json = ?");
      params.push(JSON.stringify(Array.isArray(data.domains) ? data.domains : []));
    }

    if (!fields.length) {
      return 0;
    }

    params.push(id);
    const [result] = await connection.query(
      `UPDATE requests SET ${fields.join(", ")} WHERE id = ?`,
      params,
    );

    return result.affectedRows;
  },

  async remove(id, connection = db) {
    const [result] = await connection.query(
      "DELETE FROM requests WHERE id = ? AND status = 'Ouverte'",
      [id],
    );
    return result.affectedRows;
  },

  async isOwner(requestId, clientId, connection = db) {
    const [rows] = await connection.query(
      "SELECT id FROM requests WHERE id = ? AND client_id = ? LIMIT 1",
      [requestId, clientId],
    );
    return rows.length > 0;
  },

  async markStatus(requestId, status, connection = db) {
    const [result] = await connection.query(
      "UPDATE requests SET status = ? WHERE id = ?",
      [status, requestId],
    );
    return result.affectedRows;
  },

  async findDistinctDomains(connection = db) {
    const [rows] = await connection.query(
      "SELECT DISTINCT domain FROM requests ORDER BY domain ASC",
    );
    return rows.map((row) => row.domain);
  },

  async findFreelancerDomains(freelancerId, connection = db) {
    const [rows] = await connection.query(
      "SELECT domain FROM freelancer_domains WHERE id_freelancer = ? ORDER BY domain ASC",
      [freelancerId],
    );
    return rows.map((row) => row.domain);
  },

  async addFreelancerDomain(freelancerId, domain, connection = db) {
    await connection.query(
      "INSERT IGNORE INTO freelancer_domains (id_freelancer, domain) VALUES (?, ?)",
      [freelancerId, domain],
    );
  },

  async removeFreelancerDomain(freelancerId, domain, connection = db) {
    const [result] = await connection.query(
      "DELETE FROM freelancer_domains WHERE id_freelancer = ? AND domain = ?",
      [freelancerId, domain],
    );
    return result.affectedRows;
  },

  async findRequestsMatchingFreelancer(freelancerId, { page = 1, limit = 10 } = {}, connection = db) {
    const offset = (page - 1) * limit;
    const [countRows] = await connection.query(
      `
        SELECT COUNT(*) AS total
        FROM requests r
        JOIN freelancer_domains fd ON fd.id_freelancer = ?
        WHERE r.status = 'Ouverte'
          AND (
            fd.domain = r.domain
            OR JSON_SEARCH(COALESCE(r.domains_json, JSON_ARRAY()), 'one', fd.domain) IS NOT NULL
            OR JSON_SEARCH(COALESCE(r.skills_json, JSON_ARRAY()), 'one', fd.domain) IS NOT NULL
          )
      `,
      [freelancerId],
    );
    const [rows] = await connection.query(
      `
        SELECT 
          r.*,
          u.name AS client_name,
          u.company AS client_company,
          u.avatar_url AS client_avatar_url
        FROM requests r
        JOIN freelancer_domains fd ON fd.id_freelancer = ?
        LEFT JOIN users u ON u.id = r.client_id
        WHERE r.status = 'Ouverte'
          AND (
            fd.domain = r.domain
            OR JSON_SEARCH(COALESCE(r.domains_json, JSON_ARRAY()), 'one', fd.domain) IS NOT NULL
            OR JSON_SEARCH(COALESCE(r.skills_json, JSON_ARRAY()), 'one', fd.domain) IS NOT NULL
          )
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [freelancerId, Number(limit), Number(offset)],
    );

    const enrichedRows = await enrichRequestsWithProposals(rows.map(mapRequestRow), connection);

    return {
      rows: enrichedRows,
      total: Number(countRows[0]?.total ?? 0),
    };
  },
};
