import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  changeRequestStatus,
  getrequestStatus,
} from "./request.controller.js";

import { authenticate } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";
import { validate } from "../../middleware/validateRequest.js";

import {
  createRequestSchema,
  updateRequestSchema,
  listRequestsSchema,
} from "./request.validation.js";

const router = Router();

// ─── Route status ──────────────────────────────────────────────
router.get("/status", asyncHandler(getrequestStatus));

// ─── Routes publiques ─────────────────────────────────────────
// Lister toutes les demandes ouvertes (accessible sans connexion)
router.get("/", validate(listRequestsSchema, "query"), getAllRequests);

// Détail d'une demande
router.get("/:id", getRequestById);

// ─── Routes protégées ─────────────────────────────────────────
router.use(authenticate); // toutes les routes ci-dessous nécessitent un token

// Mes demandes (client uniquement)
router.get("/my/list", authorize("client"), getMyRequests);

// Créer une demande (client uniquement)
router.post(
  "/",
  authorize("client"),
  validate(createRequestSchema),
  createRequest
);

// Modifier une demande (client propriétaire ou admin)
router.put(
  "/:id",
  authorize("client", "admin"),
  validate(updateRequestSchema),
  updateRequest
);

// Changer le statut (client propriétaire ou admin)
router.patch(
  "/:id/status",
  authorize("client", "admin"),
  changeRequestStatus
);

// Supprimer une demande (client propriétaire ou admin)
router.delete("/:id", authorize("client", "admin"), deleteRequest);

export default router;
