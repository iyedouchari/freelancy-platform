import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import { requestService } from "./request.service.js";


export const getrequestStatus = async (_req, res) => {
  return successResponse(res, {
    statuses: ["Ouverte", "En cours", "Fermee"],
    negotiable: [true, false],
    message: "requests module is operational.",
  });
};


export const createRequest = async (req, res) => {
  try {
    const request = await requestService.createRequest(req.user.id, req.body);
    return successResponse(res, { statusCode: 201, data: request, message: "Demande créée avec succès" });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const result = await requestService.getAllRequests(req.query);
    return successResponse(res, { statusCode: 200, data: result });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};


export const getAvailableDomains = async (_req, res) => {
  try {
    const domains = await requestService.getAvailableDomains();
    return successResponse(res, { statusCode: 200, data: domains });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};


export const getMyRequests = async (req, res) => {
  try {
    const result = await requestService.getClientRequests(req.user.id, req.query);
    return successResponse(res, { statusCode: 200, data: result });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};


export const getMatchingRequests = async (req, res) => {
  try {
    const result = await requestService.getMatchingRequests(req.user.id, req.query);
    return successResponse(res, { statusCode: 200, data: result });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};


export const getRequestById = async (req, res) => {
  try {
    const request = await requestService.getRequestById(parseInt(req.params.id));
    return successResponse(res, { statusCode: 200, data: request });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};

export const updateRequest = async (req, res) => {
  try {
    const request = await requestService.updateRequest(
      parseInt(req.params.id), req.user.id, req.user.role, req.body
    );
    return successResponse(res, { statusCode: 200, data: request, message: "Demande mise à jour" });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};


export const changeStatus = async (req, res) => {
  try {
    const request = await requestService.changeRequestStatus(
      parseInt(req.params.id), req.user.id, req.user.role, req.body.status
    );
    return successResponse(res, { statusCode: 200, data: request, message: "Statut mis à jour" });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};


export const deleteRequest = async (req, res) => {
  try {
    await requestService.deleteRequest(parseInt(req.params.id), req.user.id, req.user.role);
    return successResponse(res, { statusCode: 200, message: "Demande supprimée avec succès" });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};


export const getMyDomains = async (req, res) => {
  try {
    const domains = await requestService.getFreelancerDomains(req.user.id);
    return successResponse(res, { statusCode: 200, data: domains });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};

export const addMyDomain = async (req, res) => {
  try {
    const domains = await requestService.addDomainToFreelancer(req.user.id, req.body.domain);
    return successResponse(res, { statusCode: 200, data: domains, message: "Domaine ajouté" });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};

export const removeMyDomain = async (req, res) => {
  try {
    const domains = await requestService.removeDomainFromFreelancer(req.user.id, req.params.domain);
    return successResponse(res, { statusCode: 200, data: domains, message: "Domaine supprimé" });
  } catch (err) {
    return errorResponse(res, { statusCode: err.statusCode || 500, message: err.message });
  }
};