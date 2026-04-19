import db from "../../config/db.js";
import { env } from "../../config/env.js";

const SYSTEM_WALLET_OWNER_ID = env.SYSTEM_WALLET_OWNER_ID;

async function addColumnIfMissing(connection, tableName, columnName, columnDefinition) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);

  if (rows.length === 0) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
}
// Permet de s'assurer que le portefeuille système existe dans la base de données, en créant un utilisateur dédié pour le portefeuille et en créant un compte de portefeuille associé si nécessaire
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
// Permet de s'assurer que les tables nécessaires pour gérer les portefeuilles et les transactions existent dans la base de données, en créant les tables wallet_accounts et wallet_transactions avec les colonnes et contraintes appropriées si elles n'existent pas déjà
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
        'penalty_debit',
        'penalty_credit',
        'submission_release',
        'refund'
      ) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      balance_before DECIMAL(15,2) NOT NULL,
      balance_after DECIMAL(15,2) NOT NULL,
      note VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_wt_wallet FOREIGN KEY (wallet_id)
        REFERENCES wallet_accounts(id) ON DELETE CASCADE,
      CONSTRAINT fk_wt_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await addColumnIfMissing(
    db,
    "wallet_transactions",
    "note",
    "note VARCHAR(500) DEFAULT NULL AFTER balance_after",
  );

  await db.query(`
    ALTER TABLE wallet_transactions
    MODIFY COLUMN type ENUM(
      'topup',
      'advance_debit',
      'advance_credit',
      'final_debit',
      'final_credit',
      'penalty',
      'penalty_debit',
      'penalty_credit',
      'submission_release',
      'refund'
    ) NOT NULL
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
// Permet de s'assurer que le schéma de la table messages est à jour avec les colonnes nécessaires pour gérer les types de messages et les fichiers attachés, en ajoutant les colonnes message_type, file_name, file_key, file_mime_type, file_size et file_url si elles n'existent pas déjà
export async function findSystemWallet(connection = db) {
  await ensureSystemWalletOwner(connection);
  return findWalletByOwnerId(SYSTEM_WALLET_OWNER_ID, connection);
}

// ─── wallet_accounts ──────────────────────────────────────────────────────────
// Permet de récupérer le portefeuille d'un utilisateur spécifique en fonction de son ID, en s'assurant que le portefeuille existe dans la base de données, et en retournant les informations du portefeuille ou null si l'utilisateur n'a pas de portefeuille
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
// Permet de recharger le portefeuille de l'utilisateur connecté en utilisant la logique métier définie dans le service, en fournissant le montant à recharger, et en retournant les informations de la transaction de recharge avec un message de succès
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
// Permet de retirer des fonds du portefeuille de l'utilisateur connecté en utilisant la logique métier définie dans le service, en fournissant le montant à retirer et les informations de compte bancaire, et en retournant les informations de la transaction de retrait avec un message de succès
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
// Permet de récupérer la liste des transactions du portefeuille de l'utilisateur connecté, en utilisant la logique métier définie dans le service pour interagir avec la base de données, et en retournant les transactions formatées avec un message de succès
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
// Permet de créer un paiement dans la base de données en effectuant une requête SQL d'insertion avec les informations du paiement fournies, et en retournant l'objet du paiement créé avec son ID généré
export async function createTransaction({
  walletId,
  dealId = null,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  note = null,
}, connection = db) {
  const [result] = await connection.query(
    `INSERT INTO wallet_transactions
       (wallet_id, deal_id, type, amount, balance_before, balance_after, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [walletId, dealId, type, amount, balanceBefore, balanceAfter, note],
  );
  return {
    id: result.insertId,
    wallet_id: walletId,
    deal_id: dealId,
    type,
    amount,
    balance_before: balanceBefore,
    balance_after:  balanceAfter,
    note,
  };
}
