import { getDb } from "../../config/db.js";

const db = getDb();

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
    penaltyCycles: Number(row.penalty_cycles ?? 0),
    createdAt: normalizeTimestamp(row.created_at),
    submittedAt: normalizeTimestamp(row.submitted_at),
    finalPaidAt: normalizeTimestamp(row.final_paid_at),
    paymentNote: row.payment_note ?? "",
    paidAmount: Number(row.paid_amount ?? 0),
    remainingAmount: Math.max(Number(row.final_price) - Number(row.paid_amount ?? 0), 0),
    advancePaid: Number(row.advance_paid_count ?? 0) > 0,
    finalPaid: Number(row.final_paid_count ?? 0) > 0,
  };
};

const reconcileStatusesForUserScope = async ({ userId, role }, connection = db) => {
  if (!userId || !role || !["client", "freelancer"].includes(role)) {
    return;
  }

  const roleColumn = role === "client" ? "d.client_id" : "d.freelancer_id";

  await connection.query(
    `UPDATE deals d
     LEFT JOIN (
       SELECT
         p.deal_id,
         MAX(CASE WHEN p.payment_type = 'Avance' AND p.status = 'Paye' THEN 1 ELSE 0 END) AS advance_paid,
         MAX(CASE WHEN p.payment_type = 'Paiement final' AND p.status = 'Paye' THEN 1 ELSE 0 END) AS final_paid
       FROM payments p
       GROUP BY p.deal_id
     ) pay ON pay.deal_id = d.id
     LEFT JOIN (
       SELECT wt.deal_id, MAX(wt.created_at) AS released_at
       FROM wallet_transactions wt
       WHERE wt.type = 'submission_release'
       GROUP BY wt.deal_id
     ) rel ON rel.deal_id = d.id
     SET
       d.submitted_at = COALESCE(d.submitted_at, rel.released_at),
       d.status = CASE
         WHEN d.status IN ('Annule', 'Annulé') THEN 'Annule'
         WHEN COALESCE(pay.final_paid, 0) = 1 AND COALESCE(d.submitted_at, rel.released_at) IS NOT NULL THEN 'Terminé'
         WHEN COALESCE(pay.final_paid, 0) = 1 THEN 'Totalité payée'
         WHEN COALESCE(pay.advance_paid, 0) = 1 THEN 'En cours'
         ELSE d.status
       END
     WHERE ${roleColumn} = ?`,
    [userId],
  );
};

const baseSelect = `
  SELECT
    d.*,
    r.title AS request_title,
    r.description AS request_description,
    cu.name AS client_name,
    fu.name AS freelancer_name,
    COALESCE((
      SELECT SUM(p.amount)
      FROM payments p
      WHERE p.deal_id = d.id AND p.status = 'Paye'
    ), 0) AS paid_amount,
    COALESCE((
      SELECT COUNT(*)
      FROM payments p
      WHERE p.deal_id = d.id
        AND p.payment_type = 'Avance'
        AND p.status = 'Paye'
    ), 0) AS advance_paid_count,
    COALESCE((
      SELECT COUNT(*)
      FROM payments p
      WHERE p.deal_id = d.id
        AND p.payment_type = 'Paiement final'
        AND p.status = 'Paye'
    ), 0) AS final_paid_count
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
      payment_note TEXT DEFAULT NULL,
      status ENUM(
        'En attente acompte',
        'En cours',
        'Totalité payé',
        'Totalité payée',
        'Terminé',
        'Actif',
        'Soumis',
        'En attente paiement final',
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

  // Normalize legacy status values safely before tightening the ENUM.
  // Step 1: convert to VARCHAR to avoid enum truncation during migration.
  await db.query(`
    ALTER TABLE deals
    MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'En cours'
  `);

  // Step 2: map all legacy/unexpected values to the canonical set.
  await db.query(`
    UPDATE deals
    SET status = CASE
      WHEN status IS NULL THEN 'En cours'
      WHEN TRIM(status) = '' THEN 'En cours'
      WHEN status IN (
        'En attente acompte',
        'Avance payé',
        'Avance payee',
        'Termine',
        'Totalite payé',
        'Totalite paye',
        'Totalité paye'
      ) THEN 'En cours'
      WHEN status = 'Totalité payé' THEN 'Totalité payée'
      WHEN status IN (
        'En cours',
        'Totalité payée',
        'Terminé',
        'Actif',
        'Soumis',
        'En attente paiement final',
        'Annule'
      ) THEN status
      ELSE 'En cours'
    END
  `);

  await db.query(`
    ALTER TABLE deals
    MODIFY COLUMN status ENUM(
      'En attente acompte',
      'En cours',
      'Totalité payée',
      'Terminé',
      'Actif',
      'Soumis',
      'En attente paiement final',
      'Annule'
    ) NOT NULL DEFAULT 'En cours'
  `);

  await addColumnIfMissing(
    "deals",
    "payment_note",
    "payment_note TEXT DEFAULT NULL AFTER final_paid_at",
  );

  await addColumnIfMissing(
    "deals",
    "penalty_cycles",
    "penalty_cycles INT NOT NULL DEFAULT 0 AFTER deadline",
  );

  await addColumnIfMissing(
    "deals",
    "submitted_at",
    "submitted_at DATETIME DEFAULT NULL AFTER penalty_cycles",
  );
};

export const ensureDealTriggers = async () => {
  await db.query("DROP TRIGGER IF EXISTS trig_after_proposal_accept");
  await db.query("DROP TRIGGER IF EXISTS trig_before_payment_update");
  await db.query("DROP TRIGGER IF EXISTS trig_after_payment_update");

  // NOTE: trig_after_proposal_accept has been removed.
  // Deals are now created explicitly in proposalService.acceptAndPay().

  await db.query(`
    CREATE TRIGGER trig_before_payment_update
    BEFORE UPDATE ON payments
    FOR EACH ROW
    BEGIN
      IF NEW.status = 'Paye' AND OLD.status <> 'Paye' THEN
        SET NEW.paid_at = CURRENT_TIMESTAMP;
      END IF;

      IF NEW.status <> 'Paye' THEN
        SET NEW.paid_at = NULL;
      END IF;
    END
  `);

  await db.query(`
    CREATE TRIGGER trig_after_payment_update
    AFTER UPDATE ON payments
    FOR EACH ROW
    BEGIN
      IF NEW.status = 'Paye' AND OLD.status <> 'Paye'
         AND NEW.payment_type = 'Avance' THEN
        UPDATE deals
        SET status = 'En cours'
        WHERE id = NEW.deal_id;
      END IF;

      IF NEW.status = 'Paye' AND OLD.status <> 'Paye'
         AND NEW.payment_type = 'Paiement final' THEN
        UPDATE deals
        SET status = CASE
              WHEN submitted_at IS NOT NULL THEN 'Terminé'
              ELSE 'Totalité payée'
            END,
            final_paid_at = CURRENT_TIMESTAMP
        WHERE id = NEW.deal_id;
      END IF;

      IF NEW.status = 'Rembourse' AND OLD.status <> 'Rembourse' THEN
        UPDATE deals
        SET status = 'Annule'
        WHERE id = NEW.deal_id;
      END IF;
    END
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
        Number((proposedPrice * 0.3).toFixed(2)),
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
    await reconcileStatusesForUserScope({ userId, role }, connection);

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

  async findByIdForClient(dealId, clientId, connection = db) {
    const [rows] = await connection.query(
      `${baseSelect} WHERE d.id = ? AND d.client_id = ? LIMIT 1`,
      [dealId, clientId],
    );
    return mapDealRow(rows[0]);
  },

  async findByClientId(clientId, connection = db) {
    const [rows] = await connection.query(
      `${baseSelect} WHERE d.client_id = ? ORDER BY d.created_at DESC`,
      [clientId],
    );
    return rows.map(mapDealRow);
  },

  async findDetailedByIdForClient(dealId, clientId, connection = db) {
    return this.findByIdForClient(dealId, clientId, connection);
  },

  async updateStatusForClient({ dealId, clientId, status }, connection = db) {
    const [result] = await connection.query(
      `UPDATE deals SET status = ? WHERE id = ? AND client_id = ?`,
      [status, dealId, clientId],
    );
    return result.affectedRows > 0;
  },

  async updatePaymentNote({ dealId, note }, connection = db) {
    await connection.query(
      `UPDATE deals SET payment_note = ? WHERE id = ?`,
      [note || null, dealId],
    );
  },
};



