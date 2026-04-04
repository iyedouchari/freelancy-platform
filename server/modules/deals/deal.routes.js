import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { getDealById, getdealStatus, listDeals } from "./deal.controller.js";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../../config/db.js";
import express from "express";

const router = express.Router();

router.get("/status", asyncHandler(getdealStatus));
router.use(authenticate);
router.get("/", asyncHandler(listDeals));
router.get("/:id", asyncHandler(getDealById));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deliveryUploadDir = path.resolve(__dirname, "../../uploads/deliveries");

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureDeliveriesTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deal_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url VARCHAR(512) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_deliveries_deal (deal_id),
      INDEX idx_deliveries_sender (sender_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

router.get("/test/:id", async (req, res) => {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT r.title FROM deals d JOIN requests r ON r.id = d.request_id WHERE d.id = ?`,
    [req.params.id]
  );
  res.json(rows[0] ?? null);
});

router.get("/username/:id", async (req, res) => {
  const db = getDb();
  const [rows] = await db.execute(
    `SELECT uc.name AS client_name, uf.name AS freelancer_name
     FROM deals d
     JOIN users uc ON uc.id = d.client_id
     JOIN users uf ON uf.id = d.freelancer_id
     WHERE d.id = ?`,
    [req.params.id]
  );
  res.json(rows[0] ?? null);
});

router.get("/:id/deliveries", async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { senderId } = req.query;

  try {
    await ensureDeliveriesTable();

    let query = `
      SELECT id, deal_id, sender_id, receiver_id, file_name, file_url, created_at
      FROM deliveries
      WHERE deal_id = ?
    `;
    const params = [id];

    if (senderId) {
      query += ` AND sender_id = ?`;
      params.push(senderId);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Erreur SQL dans /api/deals/:id/deliveries :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.delete("/:id/deliveries/:deliveryId", async (req, res) => {
  const db = getDb();
  const { id, deliveryId } = req.params;
  const requesterId = Number(req.user?.id);

  try {
    await ensureDeliveriesTable();

    const [rows] = await db.execute(
      `SELECT id, deal_id, sender_id, receiver_id, file_url
       FROM deliveries
       WHERE id = ? AND deal_id = ?
       LIMIT 1`,
      [deliveryId, id]
    );

    const delivery = rows[0];

    if (!delivery) {
      return res.status(404).json({ message: "Livraison introuvable." });
    }

    const isAllowedUser = Number(delivery.sender_id) === requesterId;

    if (!isAllowedUser) {
      return res.status(403).json({ message: "Suppression non autorisee." });
    }

    await db.execute(`DELETE FROM deliveries WHERE id = ?`, [deliveryId]);

    if (delivery.file_url) {
      const relativePath = String(delivery.file_url).replace(/^\/+/, "").split("/").join(path.sep);
      const absolutePath = path.resolve(__dirname, "../../", relativePath);

      if (absolutePath.startsWith(deliveryUploadDir)) {
        await fs.unlink(absolutePath).catch(() => null);
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression livraison /api/deals/:id/deliveries/:deliveryId :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post(
  "/:id/deliveries/upload",
  express.raw({ type: "*/*", limit: "20mb" }),
  async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { senderId, receiverId, fileName } = req.query;

    if (!id || !senderId || !receiverId || !fileName) {
      return res.status(400).json({ message: "Parametres manquants pour la livraison." });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: "Fichier vide." });
    }

    try {
      await ensureDeliveriesTable();
      await fs.mkdir(deliveryUploadDir, { recursive: true });

      const safeOriginalName = sanitizeFileName(String(fileName));
      const ext = path.extname(safeOriginalName);
      const baseName = path.basename(safeOriginalName, ext) || "file";
      const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${baseName}${ext}`;
      const absolutePath = path.join(deliveryUploadDir, uniqueName);
      const fileUrl = `/uploads/deliveries/${uniqueName}`;

      await fs.writeFile(absolutePath, req.body);

      const [insertResult] = await db.execute(
        `INSERT INTO deliveries (deal_id, sender_id, receiver_id, file_name, file_url)
         VALUES (?, ?, ?, ?, ?)`,
        [id, senderId, receiverId, safeOriginalName, fileUrl]
      );

      const [rows] = await db.execute(
        `SELECT id, deal_id, sender_id, receiver_id, file_name, file_url, created_at
         FROM deliveries
         WHERE id = ?`,
        [insertResult.insertId]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Erreur upload livraison /api/deals/:id/deliveries/upload :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

router.get("/:id", async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await db.execute(
      `SELECT d.id, d.status, r.title, r.description, d.final_price, d.deadline,
              DATEDIFF(d.deadline, NOW()) AS days_left, d.client_id, d.freelancer_id,
              uc.name AS client_name, uf.name AS freelancer_name
       FROM deals d
       JOIN requests r ON r.id = d.request_id
       JOIN users uc ON uc.id = d.client_id
       JOIN users uf ON uf.id = d.freelancer_id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Deal introuvable" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur SQL dans /api/deals/:id :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});




export default router;
