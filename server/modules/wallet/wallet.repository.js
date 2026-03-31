import db from "../../config/db.js";

// ─── wallet_accounts ──────────────────────────────────────────────────────────

export async function findWalletByOwnerId(ownerId) {
  const [rows] = await db.query(
    "SELECT * FROM wallet_accounts WHERE owner_id = ?",
    [ownerId]
  );
  return rows[0] ?? null;
}

export async function creditWallet(ownerId, amount) {
  await db.query(
    "UPDATE wallet_accounts SET balance = balance + ? WHERE owner_id = ?",
    [amount, ownerId]
  );
}

export async function debitWallet(ownerId, amount) {
  const [result] = await db.query(
    `UPDATE wallet_accounts
     SET balance = balance - ?
     WHERE owner_id = ? AND balance >= ?`,
    [amount, ownerId, amount]
  );
  if (result.affectedRows === 0) {
    throw new Error("Solde insuffisant.");
  }
}

// ─── wallet_transactions ──────────────────────────────────────────────────────

export async function findTransactionsByWalletId(walletId) {
  const [rows] = await db.query(
    `SELECT * FROM wallet_transactions
     WHERE wallet_id = ?
     ORDER BY created_at DESC`,
    [walletId]
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
}) {
  const [result] = await db.query(
    `INSERT INTO wallet_transactions
       (wallet_id, deal_id, type, amount, balance_before, balance_after)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [walletId, dealId, type, amount, balanceBefore, balanceAfter]
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
