import crypto from "crypto";
import { pipeline } from "stream/promises";
import express, { Router } from "express";
import { deleteFromB2, downloadFromB2, uploadToB2 } from "../../config/b2.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { createReport, listMyReports } from "./report.controller.js";
import { createReportSchema } from "./report.validation.js";

const router = Router();

const sanitizeFileName = (fileName) =>
  String(fileName || "piece-jointe")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

function buildStorageKey(folder, fileName) {
  const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
  const baseName = ext ? fileName.slice(0, -ext.length) : fileName;
  const safeBaseName = baseName || "file";
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${ext}`;
}

function buildReportDownloadUrl(key, fileName) {
  const params = new URLSearchParams({
    key,
    fileName,
  });
  return `/api/reports/file?${params.toString()}`;
}



router.use(authMiddleware);

router.get("/my", asyncHandler(listMyReports));

router.get("/file", async (req, res) => {
  const { key, fileName } = req.query;

  if (!key) {
    return res.status(400).json({ error: "Cle fichier manquante." });
  }

  try {
    const safeFileName = sanitizeFileName(String(fileName || "attachment"));
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
  "/attachments/upload",
  express.raw({ type: "*/*", limit: "15mb" }),
  asyncHandler(async (req, res) => {
    const originalFileName = String(req.query.fileName || "").trim();

    if (!originalFileName) {
      return res.status(400).json({ success: false, message: "Nom du fichier manquant." });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ success: false, message: "Fichier vide." });
    }

    const safeOriginalName = sanitizeFileName(originalFileName);
    const mimeType = String(req.headers["content-type"] || "application/octet-stream");
    const key = buildStorageKey("report-attachments", safeOriginalName);

    try {
      await uploadToB2({
        key,
        body: req.body,
        contentType: mimeType,
      });

      return successResponse(res, {
        statusCode: 201,
        message: "Piece jointe envoyee avec succes.",
        data: {
          fileName: safeOriginalName,
          key,
          fileUrl: buildReportDownloadUrl(key, safeOriginalName),
          mimeType,
          size: req.body.length,
        },
      });
    } catch (err) {
      await deleteFromB2(key).catch(() => null);
      console.error("Erreur upload rapport :", err.message);
      return res.status(500).json({ success: false, message: "Impossible d'uploader le fichier." });
    }
  }),
);
router.post("/", validateRequest(createReportSchema), asyncHandler(createReport));

export default router;
