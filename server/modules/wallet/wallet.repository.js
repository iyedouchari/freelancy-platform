import db from "../../config/db.js";
import { env } from "../../config/env.js";

const SYSTEM_WALLET_OWNER_ID = env.SYSTEM_WALLET_OWNER_ID;

export async function ensureSystemWalletOwner(connection = db) {
  await connection.query(
    `INSERT INTO users (id, name, email, password, role, company, professional_title, location, phone)
     VALUES (?, ?, ?, ?, 'ADMIN', 'Platform', 'Escrow', 'System', '00000000')
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       email = VALUES(email),
       password = VALUES(password),
       role = 'ADMIN'`,
    [
      SYSTEM_WALLET_OWNER_ID,
      env.SYSTEM_WALLET_NAME,
      env.SYSTEM_WALLET_EMAIL,
      env.SYSTEM_WALLET_PASSWORD,
    ],
  );

  await ensureWalletByOwnerId(SYSTEM_WALLET_OWNER_ID, connection);
}

export async function ensureWalletTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS wallet_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_id INT NOT NULL UNIQUE,
      balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_wallet_owner FOREIGN KEY (owner_id)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wallet_id INT NOT NULL,
      deal_id INT DEFAULT NULL,
      type ENUM(
        'topup',
        'advance_debit',
        'advance_credit',
        'final_debit',
        'final_credit',
        'penalty',
        'refund'
      ) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      balance_before DECIMAL(15,2) NOT NULL,
      balance_after DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_wt_wallet FOREIGN KEY (wallet_id)
        REFERENCES wallet_accounts(id) ON DELETE CASCADE,
      CONSTRAINT fk_wt_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function ensureWalletByOwnerId(ownerId, connection = db) {
  await connection.query(
    `INSERT INTO wallet_accounts (owner_id, balance)
     VALUES (?, 0)
     ON DUPLICATE KEY UPDATE owner_id = owner_id`,
    [ownerId],
  );
}

export async function findSystemWallet(connection = db) {
  await ensureSystemWalletOwner(connection);
  return findWalletByOwnerId(SYSTEM_WALLET_OWNER_ID, connection);
}

// ─── wallet_accounts ──────────────────────────────────────────────────────────

export async function findWalletByOwnerId(ownerId, connection = db) {
  if (!Number.isInteger(Number(ownerId)) || ownerId <= 0) {
    throw new Error("Invalid wallet owner ID");
  }
  await ensureWalletByOwnerId(ownerId, connection);
  const [rows] = await connection.query(
    "SELECT * FROM wallet_accounts WHERE owner_id = ?",
    [ownerId],
  );
  return rows[0] ?? null;
}

export async function creditWallet(ownerId, amount, connection = db) {
  const validAmount = Number(amount);
  if (!Number.isFinite(validAmount) || validAmount < 0) {
    throw new Error("Invalid credit amount");
  }
  await ensureWalletByOwnerId(ownerId, connection);
  await connection.query(
    "UPDATE wallet_accounts SET balance = balance + ? WHERE owner_id = ?",
    [validAmount, ownerId],
  );
}

export async function debitWallet(ownerId, amount, connection = db) {
  const validAmount = Number(amount);
  if (!Number.isFinite(validAmount) || validAmount <= 0) {
    throw new Error("Invalid debit amount");
  }
  await ensureWalletByOwnerId(ownerId, connection);
  const [result] = await connection.query(
    `UPDATE wallet_accounts
     SET balance = balance - ?
     WHERE owner_id = ? AND balance >= ?`,
    [validAmount, ownerId, validAmount],
  );
  if (result.affectedRows === 0) {
    throw new Error("Solde insuffisant.");
  }
}

// ─── wallet_transactions ──────────────────────────────────────────────────────

export async function findTransactionsByWalletId(walletId, connection = db) {
  const [rows] = await connection.query(
    `SELECT wt.*, d.status AS deal_status, r.title AS request_title
     FROM wallet_transactions wt
     LEFT JOIN deals d ON d.id = wt.deal_id
     LEFT JOIN requests r ON r.id = d.request_id
     WHERE wallet_id = ?
     ORDER BY created_at DESC`,
    [walletId],
  );
  return rows;
}

export async function createTransaction({
  walletId,
  dealId = null,
  type,
  amount,
  balanceBefore,
  balanceAfter,
}, connection = db) {
  const [result] = await connection.query(
    `INSERT INTO wallet_transactions
       (wallet_id, deal_id, type, amount, balance_before, balance_after)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [walletId, dealId, type, amount, balanceBefore, balanceAfter],
  );
  return {
    id: result.insertId,
    wallet_id: walletId,
    deal_id: dealId,
    type,
    amount,
    balance_before: balanceBefore,
    balance_after:  balanceAfter,
  };
}
