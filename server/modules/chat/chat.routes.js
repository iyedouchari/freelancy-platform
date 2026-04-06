import crypto from "crypto";
import express from "express";
import { pipeline } from "stream/promises";
import { deleteFromB2, downloadFromB2, uploadToB2 } from "../../config/b2.js";
import { getMessageHistory, markMessagesAsRead } from "./chat.service.js";

const router = express.Router();

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
}

function buildStorageKey(folder, fileName) {
  const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
  const baseName = ext ? fileName.slice(0, -ext.length) : fileName;
  const safeBaseName = baseName || "file";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${ext}`;
}

function buildChatDownloadUrl(key, fileName) {
  const params = new URLSearchParams({
    key,
    fileName,
  });

  return `/api/chat/file?${params.toString()}`;
}

router.get("/history/:dealId", async (req, res) => {
  const { dealId } = req.params;

  try {
    const messages = await getMessageHistory(dealId);
    res.json(messages);
  } catch (err) {
    console.error("Erreur /history :", err.message);
    res.status(500).json({ error: "Impossible de charger l'historique." });
  }
});

router.patch("/read/:dealId/:userId", async (req, res) => {
  const { dealId, userId } = req.params;

  try {
    await markMessagesAsRead(dealId, userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur /read :", err.message);
    res.status(500).json({ error: "Impossible de marquer les messages." });
  }
});

router.get("/file", async (req, res) => {
  const { key, fileName } = req.query;

  if (!key) {
    return res.status(400).json({ error: "Cle fichier manquante." });
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
  } catch (err) {
    console.error("Erreur /file :", err.message);
    return res.status(500).json({ error: "Impossible de telecharger le fichier." });
  }
});

router.post(
  "/upload",
  express.raw({ type: "*/*", limit: "20mb" }),
  async (req, res) => {
    const { dealId, senderId, receiverId, fileName } = req.query;

    if (!dealId || !senderId || !receiverId || !fileName) {
      return res.status(400).json({ error: "Parametres manquants pour l'upload." });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "Fichier vide." });
    }

    const safeOriginalName = sanitizeFileName(String(fileName));
    const mimeType = String(req.headers["content-type"] || "application/octet-stream");
    const key = buildStorageKey("chat", safeOriginalName);

    try {
      await uploadToB2({
        key,
        body: req.body,
        contentType: mimeType,
      });

      return res.json({
        fileName: safeOriginalName,
        key,
        mimeType,
        size: req.body.length,
        fileUrl: buildChatDownloadUrl(key, safeOriginalName),
      });
    } catch (err) {
      await deleteFromB2(key).catch(() => null);
      console.error("Erreur /upload :", err.message);
      return res.status(500).json({ error: "Impossible d'uploader le fichier." });
    }
  }
);

export default router;
