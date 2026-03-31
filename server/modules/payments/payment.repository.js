// ─── payment.repository.js ───────────────────────────────────────────────────
// Accès DB pour la table payments.
// Adapté au schéma du groupe : payment_type, status en français.

import db from "../../config/db.js";

export async function findPaymentsByDealId(dealId) {
  const [rows] = await db.query(
    `SELECT * FROM payments WHERE deal_id = ? ORDER BY created_at DESC`,
    [dealId]
  );
  return rows;
}

export async function findPaymentById(paymentId) {
  const [rows] = await db.query(
    `SELECT * FROM payments WHERE id = ?`,
    [paymentId]
  );
  return rows[0] ?? null;
}

export async function findPaymentByDealAndType(dealId, paymentType) {
  const [rows] = await db.query(
    `SELECT * FROM payments WHERE deal_id = ? AND payment_type = ?`,
    [dealId, paymentType]
  );
  return rows[0] ?? null;
}

export async function createPayment({
  dealId,
  clientId,
  freelancerId,
  amount,
  paymentType,  // 'Avance' | 'Paiement final'
}) {
  const [result] = await db.query(
    `INSERT INTO payments
       (deal_id, client_id, freelancer_id, amount, payment_type, status)
     VALUES (?, ?, ?, ?, ?, 'En attente')`,
    [dealId, clientId, freelancerId, amount, paymentType]
  );
  return {
    id: result.insertId,
    dealId,
    clientId,
    freelancerId,
    amount,
    paymentType,
    status: "En attente",
  };
}

export async function updatePaymentStatus(paymentId, status) {
  // Le trigger trig_after_payment_update met à jour le deal automatiquement
  await db.query(
    `UPDATE payments SET status = ? WHERE id = ?`,
    [status, paymentId]
  );
}