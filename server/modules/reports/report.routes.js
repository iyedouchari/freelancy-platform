import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import express, { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { createReport, listMyReports } from "./report.controller.js";
import { createReportSchema } from "./report.validation.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportUploadsDir = path.resolve(__dirname, "../../uploads/report-attachments");

const sanitizeFileName = (fileName) =>
  String(fileName || "piece-jointe")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

const buildStoredFileName = (fileName) => {
  const safeName = sanitizeFileName(fileName);
  const ext = path.extname(safeName);
  const baseName = ext ? safeName.slice(0, -ext.length) : safeName;
  return `${Date.now()}-${crypto.randomUUID()}-${baseName || "piece-jointe"}${ext}`;
};

router.use(authMiddleware);

router.get("/my", asyncHandler(listMyReports));
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

    await mkdir(reportUploadsDir, { recursive: true });

    const safeOriginalName = sanitizeFileName(originalFileName);
    const storedFileName = buildStoredFileName(safeOriginalName);
    const relativeUrl = `/uploads/report-attachments/${storedFileName}`;

    await writeFile(path.join(reportUploadsDir, storedFileName), req.body);

    return successResponse(res, {
      statusCode: 201,
      message: "Piece jointe envoyee avec succes.",
      data: {
        fileName: safeOriginalName,
        fileUrl: relativeUrl,
        mimeType: String(req.headers["content-type"] || "application/octet-stream"),
        size: req.body.length,
      },
    });
  }),
);
router.post("/", validateRequest(createReportSchema), asyncHandler(createReport));

export default router;
