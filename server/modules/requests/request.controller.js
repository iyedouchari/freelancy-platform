import { successResponse } from "../../utils/apiResponse.js";

export const getrequestStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "requests module is scaffolded but not implemented yet.",
  });
};
import { requestService } from "./request.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

// POST /api/requests
export const createRequest = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.user, req.body);
  sendSuccess(res, request, "Demande créée avec succès", 201);
});

// GET /api/requests
export const getAllRequests = asyncHandler(async (req, res) => {
  const result = await requestService.getAllRequests(req.query);
  sendSuccess(res, result, "Liste des demandes");
});

// GET /api/requests/my
export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await requestService.getMyRequests(req.user.id, req.query);
  sendSuccess(res, requests, "Vos demandes");
});

// GET /api/requests/:id
export const getRequestById = asyncHandler(async (req, res) => {
  const request = await requestService.getRequestById(req.params.id);
  sendSuccess(res, request, "Détail de la demande");
});

// PUT /api/requests/:id
export const updateRequest = asyncHandler(async (req, res) => {
  const updated = await requestService.updateRequest(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body
  );
  sendSuccess(res, updated, "Demande mise à jour");
});

// DELETE /api/requests/:id
export const deleteRequest = asyncHandler(async (req, res) => {
  const result = await requestService.deleteRequest(
    req.params.id,
    req.user.id,
    req.user.role
  );
  sendSuccess(res, result, "Demande supprimée");
});

// PATCH /api/requests/:id/status
export const changeRequestStatus = asyncHandler(async (req, res) => {
  const updated = await requestService.changeStatus(
    req.params.id,
    req.body.status,
    req.user.id,
    req.user.role
  );
  sendSuccess(res, updated, "Statut mis à jour");
});