import { requestRepository } from "./request.repository.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const requestService = {
  // Créer une demande (client uniquement)
  async createRequest(user, data) {
    if (user.role !== "client") {
      throw new AppError("Seuls les clients peuvent publier des demandes", 403);
    }

    const request = await requestRepository.create(user.id, data);
    return request;
  },

  // Obtenir une demande par ID
  async getRequestById(id) {
    const request = await requestRepository.findById(id);
    if (!request) throw new AppError("Demande introuvable", 404);

    return request;
  },

  // Lister toutes les demandes (publiques)
  async getAllRequests(query) {
    const { total, rows } = await requestRepository.findAll(query);
    return paginate(rows, total, query.page, query.limit);
  },

  // Mes demandes (client connecté)
  async getMyRequests(clientId, query) {
    const rows = await requestRepository.findByClientId(clientId, query);
    return rows;
  },

  // Modifier une demande
  async updateRequest(requestId, userId, role, data) {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404);

    const isOwner = await requestRepository.isOwner(requestId, userId);
    if (!isOwner && role !== "admin") {
      throw new AppError("Action non autorisée", 403);
    }

    if (request.status !== "open" && role !== "admin") {
      throw new AppError(
        "Impossible de modifier une demande déjà en cours ou terminée",
        400
      );
    }

    const updated = await requestRepository.update(requestId, data);
    return updated;
  },

  // Supprimer une demande (soft delete)
  async deleteRequest(requestId, userId, role) {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404);

    const isOwner = await requestRepository.isOwner(requestId, userId);
    if (!isOwner && role !== "admin") {
      throw new AppError("Action non autorisée", 403);
    }

    if (request.status === "in_progress") {
      throw new AppError(
        "Impossible de supprimer une demande en cours",
        400
      );
    }

    await requestRepository.softDelete(requestId);

    return { message: "Demande supprimée avec succès" };
  },

  // Changer le statut (admin ou système)
  async changeStatus(requestId, status, userId, role) {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404);

    const isOwner = await requestRepository.isOwner(requestId, userId);
    if (!isOwner && role !== "admin") {
      throw new AppError("Action non autorisée", 403);
    }

    const updated = await requestRepository.update(requestId, { status });
    return updated;
  },
};