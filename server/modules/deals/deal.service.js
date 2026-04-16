import AppError from "../../utils/AppError.js";
import { getDb } from "../../config/db.js";
import { hashPassword } from "../../utils/hashPassword.js";
import { dealRepository } from "./deal.repository.js";

const db = getDb();

const canAccessDeal = (deal, user) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "client") {
    return deal.clientId === user.id;
  }

  if (user.role === "freelancer") {
    return deal.freelancerId === user.id;
  }

  return false;
};

const STATUS_BY_CLIENT_ACTION = {
  active: "En cours",
  completed: "Terminé",
  fully_paid: "Totalité payé",
};

const normalizeDateOnly = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
};

const normalizeDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const normalizePositiveNumber = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(amount * 100) / 100;
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function resolveFreelancerUserId(connection, proposal) {
  const numericFreelancerId = Number.parseInt(proposal?.freelancerId, 10);
  if (Number.isInteger(numericFreelancerId) && numericFreelancerId > 0) {
    const [existingById] = await connection.query(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [numericFreelancerId],
    );
    if (existingById[0]) {
      return Number(existingById[0].id);
    }
  }

  const freelancerEmail = String(proposal?.freelancerEmail || "").trim().toLowerCase();
  if (freelancerEmail) {
    const [existingByEmail] = await connection.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [freelancerEmail],
    );
    if (existingByEmail[0]) {
      return Number(existingByEmail[0].id);
    }
  }

  const freelancerName = String(proposal?.freelancerName || "").trim();
  if (!freelancerName) {
    throw new AppError("Nom freelancer manquant pour synchronisation.", 400, "MISSING_FREELANCER_NAME");
  }

  const [existingByName] = await connection.query(
    `SELECT id
     FROM users
     WHERE name = ? AND role = 'FREELANCER'
     ORDER BY id ASC
     LIMIT 1`,
    [freelancerName],
  );
  if (existingByName[0]) {
    return Number(existingByName[0].id);
  }

  const emailLocalPart = slugify(freelancerName) || `freelancer-${Date.now()}`;
  const generatedEmail = `${emailLocalPart}@freelancy.local`;
  const generatedPassword = `TmpSync-${Date.now()}-x`;
  const passwordHash = await hashPassword(generatedPassword);

  const [insertResult] = await connection.query(
    `INSERT INTO users (
      name,
      company,
      professional_title,
      location,
      email,
      phone,
      password,
      role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'FREELANCER')`,
    [
      freelancerName,
      null,
      proposal?.title ? String(proposal.title) : "Freelancer",
      null,
      generatedEmail,
      null,
      passwordHash,
    ],
  );

  return Number(insertResult.insertId);
}

async function findExistingDeal(connection, { clientId, freelancerId, requestTitle, finalPrice, deadlineDate }) {
  const [rows] = await connection.query(
    `SELECT d.id
     FROM deals d
     INNER JOIN requests r ON r.id = d.request_id
     WHERE d.client_id = ?
       AND d.freelancer_id = ?
       AND r.title = ?
       AND d.final_price = ?
       AND DATE(d.deadline) = ?
     ORDER BY d.id DESC
     LIMIT 1`,
    [clientId, freelancerId, requestTitle, finalPrice, deadlineDate],
  );

  return rows[0] ? Number(rows[0].id) : null;
}

async function ensureWalletOnConnection(connection, ownerId) {
  await connection.query(
    `INSERT INTO wallet_accounts (owner_id, balance)
     VALUES (?, 0)
     ON DUPLICATE KEY UPDATE owner_id = owner_id`,
    [ownerId],
  );
}

export const dealService = {
  async listDeals(user) {
    return dealRepository.findForUser(
      {
        userId: user.id ?? user.userId,
        role: user.role,
      },
    );
  },

  async getDealById(dealId, user) {
    const deal = await dealRepository.findById(Number(dealId));

    if (!deal) {
      throw new AppError("Deal introuvable.", 404, "DEAL_NOT_FOUND");
    }

    if (!canAccessDeal(deal, user)) {
      throw new AppError("Action non autorisee.", 403, "FORBIDDEN");
    }

    return deal;
  },

  async listMyDeals(user) {
    return dealRepository.findForUser(
      {
        userId: user.id ?? user.userId,
        role: user.role,
      },
    );
  },

  async updateDealStatus({ dealId, clientId, newStatus }) {
    const normalized = String(newStatus || "").toLowerCase();
    const targetStatus = STATUS_BY_CLIENT_ACTION[normalized];

    if (!targetStatus) {
      throw new AppError("Statut de deal invalide. Valeurs attendues: active, completed, fully_paid.", 400, "INVALID_DEAL_STATUS");
    }

    const existingDeal = await dealRepository.findByIdForClient(dealId, clientId);
    if (!existingDeal) {
      throw new AppError("Deal introuvable pour ce client.", 404, "DEAL_NOT_FOUND");
    }

    const updated = await dealRepository.updateStatusForClient({
      dealId,
      clientId,
      status: targetStatus,
    });

    if (!updated) {
      throw new AppError("Mise a jour du deal impossible.", 400, "DEAL_UPDATE_FAILED");
    }

    return { dealId, status: targetStatus };
  },

  async syncAcceptedDeal({ clientId, payload }) {
    const request = payload?.request || {};
    const proposal = payload?.proposal || {};
    const agreement = payload?.agreement || {};

    const requestTitle = String(request.title || "").trim();
    const requestDescription = String(request.description || "").trim();
    const requestDomain = String(request.category || request.domain || "General").trim();

    if (!requestTitle) {
      throw new AppError("Titre de demande manquant.", 400, "MISSING_REQUEST_TITLE");
    }

    const finalPrice = normalizePositiveNumber(
      agreement.price ?? proposal.rate ?? request.budget,
    );
    if (!finalPrice) {
      throw new AppError("Montant du deal invalide.", 400, "INVALID_DEAL_AMOUNT");
    }

    const requestDeadline = normalizeDateOnly(
      agreement.deadline ?? proposal.proposedDeadline ?? request.deadline,
    );
    const proposalDeadline = normalizeDateTime(
      agreement.deadline ?? proposal.proposedDeadline ?? request.deadline,
    );

    if (!requestDeadline || !proposalDeadline) {
      throw new AppError("Date limite invalide.", 400, "INVALID_DEADLINE");
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const freelancerId = await resolveFreelancerUserId(connection, proposal);
      const existingDealId = await findExistingDeal(connection, {
        clientId,
        freelancerId,
        requestTitle,
        finalPrice,
        deadlineDate: requestDeadline,
      });

      if (existingDealId) {
        await connection.commit();
        return dealRepository.findDetailedByIdForClient(existingDealId, clientId);
      }

      const [requestResult] = await connection.query(
        `INSERT INTO requests (
          client_id,
          title,
          description,
          domain,
          budget,
          negotiable,
          deadline,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'En cours')`,
        [
          clientId,
          requestTitle,
          requestDescription || "Synchronise depuis interface client",
          requestDomain || "General",
          finalPrice,
          Boolean(request.negotiable ?? true),
          requestDeadline,
        ],
      );
      const requestId = Number(requestResult.insertId);

      const [proposalResult] = await connection.query(
        `INSERT INTO proposals (
          request_id,
          freelancer_id,
          proposed_price,
          proposed_deadline_at,
          cover_letter,
          status
        ) VALUES (?, ?, ?, ?, ?, 'Acceptee')`,
        [
          requestId,
          freelancerId,
          finalPrice,
          proposalDeadline,
          String(proposal.summary || "Proposition synchronisee depuis interface client."),
        ],
      );
      const proposalId = Number(proposalResult.insertId);

      const advanceAmount = Math.round(finalPrice * 0.3 * 100) / 100;
      const advanceDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [dealResult] = await connection.query(
        `INSERT INTO deals (
          proposal_id,
          request_id,
          client_id,
          freelancer_id,
          final_price,
          advance_amount,
          advance_due_at,
          deadline,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'En attente acompte')`,
        [
          proposalId,
          requestId,
          clientId,
          freelancerId,
          finalPrice,
          advanceAmount,
          advanceDueAt,
          proposalDeadline,
        ],
      );

      await ensureWalletOnConnection(connection, clientId);
      await ensureWalletOnConnection(connection, freelancerId);

      await connection.commit();
      const dealId = Number(dealResult.insertId);
      return dealRepository.findDetailedByIdForClient(dealId, clientId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};
