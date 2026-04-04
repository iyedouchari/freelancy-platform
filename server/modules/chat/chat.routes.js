import crypto from "crypto";
import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getMessageHistory, markMessagesAsRead } from "./chat.service.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads/chat");

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
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

    try {
      await fs.mkdir(uploadDir, { recursive: true });

      const safeOriginalName = sanitizeFileName(String(fileName));
      const ext = path.extname(safeOriginalName);
      const baseName = path.basename(safeOriginalName, ext) || "file";
      const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${baseName}${ext}`;
      const absolutePath = path.join(uploadDir, uniqueName);

      await fs.writeFile(absolutePath, req.body);

      return res.json({
        fileName: safeOriginalName,
        fileUrl: `/uploads/chat/${uniqueName}`,
      });
    } catch (err) {
      console.error("Erreur /upload :", err.message);
      return res.status(500).json({ error: "Impossible d'uploader le fichier." });
    }
  }
);

export default router;
