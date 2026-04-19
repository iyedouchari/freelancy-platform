import crypto from "crypto";
import express from "express";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getMessageHistory, markMessagesAsRead } from "./chat.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatUploadsDir = path.resolve(__dirname, "../../uploads/chat");

const router = express.Router();

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
}
// Génère une clé de stockage sécurisée pour un fichier uploadé, en préservant l'extension et en ajoutant un identifiant unique
function buildStorageKey(folder, fileName) {
  const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
  const baseName = ext ? fileName.slice(0, -ext.length) : fileName;
  const safeBaseName = baseName || "file";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${ext}`;
}

function buildChatDownloadUrl(fileName) {
  const params = new URLSearchParams({ fileName });
  return `/uploads/chat/${fileName}?${params.toString()}`;
}
// Permet de récupérer l'historique des messages d'une conversation liée à un deal
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
// Permet de marquer les messages d'une conversation comme lus pour un utilisateur donné
router.patch("/read/:dealId/:userId", async (req, res) => {
  const { dealId, userId } = req.params;

  try {
    await markMessagesAsRead(dealId, userId);// On retourne une réponse simple pour indiquer que l'opération a réussi, sans renvoyer de données spécifiques
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur /read :", err.message);// En cas d'erreur, on retourne une réponse d'erreur claire plutôt que d'essayer de masquer l'erreur
    res.status(500).json({ error: "Impossible de marquer les messages." });
  }
});

router.get("/:fileName", async (req, res) => {
  const { fileName } = req.params;

  if (!fileName) {
    return res.status(400).json({ error: "Nom du fichier manquant." });
  }

  try {
    const filePath = path.join(chatUploadsDir, fileName);
    const fileBuffer = await readFile(filePath);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFileName(fileName)}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", String(fileBuffer.length));
    res.send(fileBuffer);
  } catch (err) {
    console.error("Erreur lecture chat :", err.message);
    return res.status(404).json({ error: "Fichier non trouve." });
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
      await mkdir(chatUploadsDir, { recursive: true });

      const safeOriginalName = sanitizeFileName(String(fileName));
      const mimeType = String(req.headers["content-type"] || "application/octet-stream");
      const storedFileName = `${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}`;
      const filePath = path.join(chatUploadsDir, storedFileName);

      await writeFile(filePath, req.body);

      return res.json({
        fileName: safeOriginalName,
        storedFileName,
        mimeType,
        size: req.body.length,
        fileUrl: buildChatDownloadUrl(storedFileName),// On retourne une URL de téléchargement sécurisée pour le fichier uploadé, plutôt que de renvoyer le chemin de stockage interne
      });
    } catch (err) {
      console.error("Erreur /upload :", err.message);
      return res.status(500).json({ error: "Impossible d'uploader le fichier." });
    }
  }
);

export default router;
