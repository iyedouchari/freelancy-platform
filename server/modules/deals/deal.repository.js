import { getDb } from "../../config/db.js";

const db = getDb();

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

const mapDealRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    proposalId: row.proposal_id,
    requestId: row.request_id,
    clientId: row.client_id,
    freelancerId: row.freelancer_id,
    clientName: row.client_name,
    freelancerName: row.freelancer_name,
    title: row.request_title,
    description: row.request_description,
    status: row.status,
    finalPrice: Number(row.final_price),
    advanceAmount: Number(row.advance_amount),
    advanceDueAt: normalizeTimestamp(row.advance_due_at),
    deadline: normalizeDate(row.deadline),
    createdAt: normalizeTimestamp(row.created_at),
    submittedAt: normalizeTimestamp(row.submitted_at),
    finalPaidAt: normalizeTimestamp(row.final_paid_at),
  };
};

const baseSelect = `
  SELECT
    d.*,
    r.title AS request_title,
    r.description AS request_description,
    cu.name AS client_name,
    fu.name AS freelancer_name
  FROM deals d
  JOIN requests r ON r.id = d.request_id
  JOIN users cu ON cu.id = d.client_id
  JOIN users fu ON fu.id = d.freelancer_id
`;

export const ensureDealsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS deals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proposal_id INT NOT NULL UNIQUE,
      request_id INT NOT NULL,
      client_id INT NOT NULL,
      freelancer_id INT NOT NULL,
      final_price DECIMAL(15,2) NOT NULL,
      advance_amount DECIMAL(15,2) NOT NULL,
      advance_due_at DATETIME NOT NULL,
      deadline DATETIME NOT NULL,
      penalty_cycles INT NOT NULL DEFAULT 0,
      submitted_at DATETIME DEFAULT NULL,
      final_paid_at DATETIME DEFAULT NULL,
      status ENUM(
        'En cours',
        'Actif',
        'Soumis',
        'En attente paiement final',
        'Termine',
        'Annule'
      ) NOT NULL DEFAULT 'En cours',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_deal_proposal FOREIGN KEY (proposal_id)
        REFERENCES proposals(id) ON DELETE RESTRICT,
      CONSTRAINT fk_deal_request FOREIGN KEY (request_id)
        REFERENCES requests(id) ON DELETE RESTRICT,
      CONSTRAINT fk_deal_client FOREIGN KEY (client_id)
        REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT fk_deal_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

export const dealRepository = {
  async createFromAcceptedProposal(proposal, request, connection = db) {
    const proposedPrice = Number(proposal.proposedPrice);
    const [result] = await connection.query(
      `
        INSERT INTO deals (
          proposal_id,
          request_id,
          client_id,
          freelancer_id,
          final_price,
          advance_amount,
          advance_due_at,
          deadline,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?, 'En cours')
      `,
      [
        proposal.id,
        proposal.requestId,
        request.clientId,
        proposal.freelancerId,
        proposedPrice,
        Number((proposedPrice * 0.1).toFixed(2)),
        formatDateForMySQL(proposal.proposedDeadline, true),
      ],
    );

    return this.findById(result.insertId, connection);
  },

  async findById(id, connection = db) {
    const [rows] = await connection.query(`${baseSelect} WHERE d.id = ? LIMIT 1`, [id]);
    return mapDealRow(rows[0]);
  },

  async findByProposalId(proposalId, connection = db) {
    const [rows] = await connection.query(`${baseSelect} WHERE d.proposal_id = ? LIMIT 1`, [proposalId]);
    return mapDealRow(rows[0]);
  },

  async findForUser({ userId, role }, connection = db) {
    let whereSql = "";
    const params = [];

    if (role === "client") {
      whereSql = "WHERE d.client_id = ?";
      params.push(userId);
    } else if (role === "freelancer") {
      whereSql = "WHERE d.freelancer_id = ?";
      params.push(userId);
    }

    const [rows] = await connection.query(
      `${baseSelect} ${whereSql} ORDER BY d.created_at DESC`,
      params,
    );

    return rows.map(mapDealRow);
  },
};



