import { getDb } from "../../config/db.js";

const db = getDb();

const addColumnIfMissing = async (tableName, columnName, columnDefinition) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);

  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
};

const formatDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
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

const mapProposalRow = (row) => {
  if (!row) {
    return null;
  }

  const proposalDate = formatDateOnly(row.proposed_deadline_at);
  const requestDate = formatDateOnly(row.request_deadline);
  const sameTerms =
    Number(row.proposed_price) === Number(row.request_budget) && proposalDate === requestDate;
  const proposalKind = row.request_negotiable
    ? sameTerms
      ? "same_terms"
      : "counter_offer"
    : "fixed_terms";

  return {
    id: row.id,
    requestId: row.request_id,
    freelancerId: row.freelancer_id,
    freelancerName: row.freelancer_name ?? null,
    freelancerTitle: row.freelancer_title ?? null,
    proposedPrice: Number(row.proposed_price),
    proposedDeadline: proposalDate,
    coverLetter: row.cover_letter ?? "",
    status: row.status,
    proposalKind,
    requestNegotiable: Boolean(row.request_negotiable),
    requestBudget: Number(row.request_budget),
    requestDeadline: requestDate,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
    clientResponse: row.client_response_type
      ? {
          responseType: row.client_response_type,
          price:
            row.client_response_price === null ? null : Number(row.client_response_price),
          deadline: formatDateOnly(row.client_response_deadline),
          status: row.client_response_status ?? "En attente",
        }
      : null,
  };
};

const proposalSelect = `
  SELECT
    p.*,
    u.name AS freelancer_name,
    u.professional_title AS freelancer_title,
    r.client_id AS request_client_id,
    r.budget AS request_budget,
    r.deadline AS request_deadline,
    r.negotiable AS request_negotiable,
    r.status AS request_status,
    r.title AS request_title
  FROM proposals p
  JOIN users u ON u.id = p.freelancer_id
  JOIN requests r ON r.id = p.request_id
`;

export const ensureProposalsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS proposals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      freelancer_id INT NOT NULL,
      proposed_price DECIMAL(15,2) NOT NULL,
      proposed_deadline_at DATETIME NOT NULL,
      cover_letter TEXT DEFAULT NULL,
      status ENUM('En attente', 'Acceptee', 'Refusee') NOT NULL DEFAULT 'En attente',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_prop_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
      CONSTRAINT fk_prop_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT uq_one_proposal UNIQUE (request_id, freelancer_id),
      CONSTRAINT chk_prop_price CHECK (proposed_price > 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await addColumnIfMissing(
    "proposals",
    "client_response_type",
    "client_response_type ENUM('same_terms', 'counter_offer') DEFAULT NULL AFTER status",
  );
  await addColumnIfMissing(
    "proposals",
    "client_response_price",
    "client_response_price DECIMAL(15,2) DEFAULT NULL AFTER client_response_type",
  );
  await addColumnIfMissing(
    "proposals",
    "client_response_deadline",
    "client_response_deadline DATE DEFAULT NULL AFTER client_response_price",
  );
  await addColumnIfMissing(
    "proposals",
    "client_response_status",
    "client_response_status ENUM('En attente', 'Acceptee', 'Refusee') DEFAULT NULL AFTER client_response_deadline",
  );
  await addColumnIfMissing(
    "proposals",
    "updated_at",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
  );
};

export const proposalRepository = {
  async findById(id, connection = db) {
    const [rows] = await connection.query(`${proposalSelect} WHERE p.id = ? LIMIT 1`, [id]);
    return mapProposalRow(rows[0]);
  },

  async findByRequestId(requestId, connection = db) {
    const [rows] = await connection.query(
      `${proposalSelect} WHERE p.request_id = ? ORDER BY p.created_at DESC`,
      [requestId],
    );

    return rows.map(mapProposalRow);
  },

  async findByRequestAndFreelancer(requestId, freelancerId, connection = db) {
    const [rows] = await connection.query(
      `${proposalSelect} WHERE p.request_id = ? AND p.freelancer_id = ? LIMIT 1`,
      [requestId, freelancerId],
    );

    return mapProposalRow(rows[0]);
  },

  async create(data, connection = db) {
    const [result] = await connection.query(
      `
        INSERT INTO proposals (
          request_id,
          freelancer_id,
          proposed_price,
          proposed_deadline_at,
          cover_letter,
          status
        )
        VALUES (?, ?, ?, ?, ?, 'En attente')
      `,
      [
        data.requestId,
        data.freelancerId,
        data.proposedPrice,
        formatDateForMySQL(data.proposedDeadline, true),
        data.coverLetter || null,
      ],
    );

    return this.findById(result.insertId, connection);
  },

  async updateStatus(id, status, connection = db) {
    await connection.query("UPDATE proposals SET status = ? WHERE id = ?", [status, id]);
    return this.findById(id, connection);
  },

  async rejectOtherProposals(requestId, acceptedProposalId, connection = db) {
    await connection.query(
      "UPDATE proposals SET status = 'Refusee' WHERE request_id = ? AND id <> ? AND status = 'En attente'",
      [requestId, acceptedProposalId],
    );
  },

  async setClientResponse(id, data, connection = db) {
    await connection.query(
      `
        UPDATE proposals
        SET
          client_response_type = ?,
          client_response_price = ?,
          client_response_deadline = ?,
          client_response_status = 'En attente'
        WHERE id = ?
      `,
      [data.responseType, data.price, formatDateForMySQL(data.deadline, false), id],
    );

    return this.findById(id, connection);
  },
};
