import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { getDealById, getdealStatus, getMyDeals, listDeals, syncAcceptedDeal, updateDealStatus } from "./deal.controller.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { getDb } from "../../config/db.js";
import express from "express";
import { deleteFromB2, downloadFromB2, uploadToB2 } from "../../config/b2.js";
import { env } from "../../config/env.js";
import { fileURLToPath } from "url";
import { logUserActivity } from "../../utils/logger.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localDeliveriesDir = path.resolve(__dirname, "../../uploads/deliveries");

router.get("/status", asyncHandler(getdealStatus));
router.use(authenticate);
router.get("/my", asyncHandler(getMyDeals));
router.post("/sync-accepted", asyncHandler(syncAcceptedDeal));
router.patch("/:dealId/status", asyncHandler(updateDealStatus));
router.get("/", asyncHandler(listDeals));
router.get("/:id", asyncHandler(getDealById));

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
}

function buildStorageKey(folder, fileName) {
  const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
  const baseName = ext ? fileName.slice(0, -ext.length) : fileName;
  const safeBaseName = baseName || "file";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${ext}`;
}

function buildDeliveryDownloadUrl(dealId, key, fileName) {
  const params = new URLSearchParams({
    key,
    fileName,
  });

  return `/api/deals/${dealId}/deliveries/download?${params.toString()}`;
}

function buildLocalDeliveryUrl(fileName) {
  return `/uploads/deliveries/${fileName}`;
}

function getKeyFromStoredUrl(fileUrl) {
  if (!fileUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(String(fileUrl), "http://localhost");
    return parsedUrl.searchParams.get("key");
  } catch {
    return null;
  }
}

function hasB2Config() {
  return Boolean(env.B2_ENDPOINT && env.B2_KEY_ID && env.B2_APP_KEY && env.B2_BUCKET);
}

async function ensureLocalDeliveriesDir() {
  await fs.promises.mkdir(localDeliveriesDir, { recursive: true });
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

router.get("/:id/deliveries/download", async (req, res) => {
  const { key, fileName } = req.query;

  if (!key) {
    return res.status(400).json({ message: "Cle fichier manquante." });
  }

  try {
    const safeFileName = sanitizeFileName(String(fileName || "download"));
    const object = await downloadFromB2(String(key));

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName}"`
    );
    res.setHeader(
      "Content-Type",
      object.ContentType || "application/octet-stream"
    );

    if (object.ContentLength != null) {
      res.setHeader("Content-Length", String(object.ContentLength));
    }

    await pipeline(object.Body, res);
  } catch (error) {
    console.error("Erreur download livraison /api/deals/:id/deliveries/download :", error);
    return res.status(500).json({ message: "Impossible de telecharger le fichier." });
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

    logUserActivity("Utilisateur a supprime une livraison", {
      userId: requesterId,
      requestId: Number(id),
      deliveryId: Number(deliveryId),
    });

    await db.execute(`DELETE FROM deliveries WHERE id = ?`, [deliveryId]);

    const storageKey = getKeyFromStoredUrl(delivery.file_url);
    if (storageKey && hasB2Config()) {
      await deleteFromB2(storageKey).catch(() => null);
    } else if (delivery.file_url?.startsWith("/uploads/deliveries/")) {
      const localFileName = path.basename(delivery.file_url);
      const localFilePath = path.join(localDeliveriesDir, localFileName);
      await fs.promises.unlink(localFilePath).catch(() => null);
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

    const safeOriginalName = sanitizeFileName(String(fileName));
    const mimeType = String(req.headers["content-type"] || "application/octet-stream");
    const key = buildStorageKey("deliveries", safeOriginalName);

    try {
      await ensureDeliveriesTable();
      let storedFileUrl;

      if (hasB2Config()) {
        await uploadToB2({
          key,
          body: req.body,
          contentType: mimeType,
        });
        storedFileUrl = buildDeliveryDownloadUrl(id, key, safeOriginalName);
      } else {
        await ensureLocalDeliveriesDir();
        const localStoredName = `${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}`;
        const localFilePath = path.join(localDeliveriesDir, localStoredName);
        await fs.promises.writeFile(localFilePath, req.body);
        storedFileUrl = buildLocalDeliveryUrl(localStoredName);
      }

      const [insertResult] = await db.execute(
        `INSERT INTO deliveries (deal_id, sender_id, receiver_id, file_name, file_url)
         VALUES (?, ?, ?, ?, ?)`,
        [id, senderId, receiverId, safeOriginalName, storedFileUrl]
      );

      await db.execute(
        `UPDATE deals
         SET status = CASE
           WHEN freelancer_id = ? THEN 'Terminé'
           ELSE status
         END,
             submitted_at = CASE
               WHEN freelancer_id = ? THEN COALESCE(submitted_at, NOW())
               ELSE submitted_at
             END
         WHERE id = ?`,
        [Number(senderId), Number(senderId), id]
      );

      const [rows] = await db.execute(
        `SELECT id, deal_id, sender_id, receiver_id, file_name, file_url, created_at
         FROM deliveries
         WHERE id = ?`,
        [insertResult.insertId]
      );

      logUserActivity("Utilisateur a soumis une livraison", {
        userId: Number(senderId),
        requestId: Number(id),
        deliveryId: Number(insertResult.insertId),
        title: safeOriginalName,
        status: "livree",
      });

      res.status(201).json({
        ...rows[0],
        key,
        mimeType,
        size: req.body.length,
      });
    } catch (error) {
      if (hasB2Config()) {
        await deleteFromB2(key).catch(() => null);
      }
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
