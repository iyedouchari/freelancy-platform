import db from "../../config/db.js";

export async function ensurePaymentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deal_id INT NOT NULL,
      client_id INT NOT NULL,
      freelancer_id INT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      payment_type ENUM('Avance', 'Paiement final') NOT NULL,
      status ENUM('En attente', 'Paye', 'Rembourse') NOT NULL DEFAULT 'En attente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMP NULL DEFAULT NULL,
      CONSTRAINT fk_payment_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE CASCADE,
      CONSTRAINT fk_payment_payer FOREIGN KEY (client_id)
        REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT fk_payment_payee FOREIGN KEY (freelancer_id)
        REFERENCES users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function findPaymentsByDealId(dealId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM payments WHERE deal_id = ? ORDER BY created_at DESC`,
    [dealId],
  );
  return rows;
}

export async function findPaymentById(paymentId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM payments WHERE id = ?`,
    [paymentId],
  );
  return rows[0] ?? null;
}

export async function findPaymentByDealAndType(dealId, paymentType, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM payments WHERE deal_id = ? AND payment_type = ? ORDER BY id DESC`,
    [dealId, paymentType],
  );
  return rows[0] ?? null;
}

export async function createPayment({
  dealId,
  clientId,
  freelancerId,
  amount,
  paymentType,
}, connection = db) {
  const [result] = await connection.query(
    `INSERT INTO payments
       (deal_id, client_id, freelancer_id, amount, payment_type, status)
     VALUES (?, ?, ?, ?, ?, 'En attente')`,
    [dealId, clientId, freelancerId, amount, paymentType],
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

export async function updatePaymentStatus(paymentId, status, connection = db) {
  await connection.query(
    `UPDATE payments SET status = ? WHERE id = ?`,
    [status, paymentId],
  );
}
