import { requestRepository } from "./request.repository.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

// Transitions de statut autorisées
const STATUS_TRANSITIONS = {
  "Ouverte":   ["En cours", "Fermee"],
  "En cours":  ["Fermee"],
  "Fermee":    [],
};

export const requestService = {

  createRequest: async (clientId, data) => {
    const id = await requestRepository.create({ client_id: clientId, ...data });
    return requestRepository.findById(id);
  },

  getRequestById: async (id) => {
    const request = await requestRepository.findById(id);
    if (!request) throw new AppError("Demande introuvable", 404);
    return request;
  },

  getAllRequests: async (queryParams) => {
    const {
      domain, status, minBudget, maxBudget, negotiable,
      page = 1, limit = 10,
      sortBy = "created_at", sortOrder = "DESC",
    } = queryParams;

    const { rows, total } = await requestRepository.findAll({
      domain,
      status,
      minBudget:  minBudget  ? parseFloat(minBudget)  : undefined,
      maxBudget:  maxBudget  ? parseFloat(maxBudget)  : undefined,
      negotiable: negotiable !== undefined
        ? negotiable === "true" || negotiable === true
        : undefined,
      page:  parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    });

    return paginate(rows, total, parseInt(page), parseInt(limit));
  },

  getClientRequests: async (clientId, queryParams) => {
    const { page = 1, limit = 10 } = queryParams;
    const { rows, total } = await requestRepository.findByClientId(clientId, {
      page: parseInt(page), limit: parseInt(limit),
    });
    return paginate(rows, total, parseInt(page), parseInt(limit));
  },

  updateRequest: async (requestId, userId, userRole, data) => {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404);

    if (userRole !== "admin" && request.clientId !== userId)
      throw new AppError("Non autorisé à modifier cette demande", 403);

    if (userRole !== "admin" && request.status !== "Ouverte")
      throw new AppError("Seules les demandes ouvertes peuvent être modifiées", 400);

    await requestRepository.update(requestId, data);
    return requestRepository.findById(requestId);
  },

  changeRequestStatus: async (requestId, userId, userRole, newStatus) => {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404);

    if (userRole !== "admin" && request.clientId !== userId)
      throw new AppError("Non autorisé", 403);

    // Vérifier la transition de statut
    const allowed = STATUS_TRANSITIONS[request.status] ?? [];
    if (!allowed.includes(newStatus))
      throw new AppError(
        `Transition invalide : "${request.status}" → "${newStatus}"`, 400
      );

    await requestRepository.update(requestId, { status: newStatus });
    return requestRepository.findById(requestId);
  },

  /**
   * Méthode interne — appelée par le module proposals (membre 3)
   * sans vérification de rôle/ownership car déjà validé côté proposal.
   * Ex: quand une proposal est acceptée → request passe à "En cours"
   *     quand le deal est finalisé      → request passe à "Fermee"
   */
  setRequestStatusInternal: async (requestId, newStatus) => {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404);

    const allowed = STATUS_TRANSITIONS[request.status] ?? [];
    if (!allowed.includes(newStatus))
      throw new AppError(
        `Transition invalide : "${request.status}" → "${newStatus}"`, 400
      );

    await requestRepository.update(requestId, { status: newStatus });
    return requestRepository.findById(requestId);
  },

  deleteRequest: async (requestId, userId, userRole) => {
    const request = await requestRepository.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404);

    if (userRole !== "admin" && request.clientId !== userId)
      throw new AppError("Non autorisé à supprimer cette demande", 403);

    const affected = await requestRepository.remove(requestId);
    if (!affected)
      throw new AppError("Impossible de supprimer : la demande n'est plus ouverte", 400);
  },

  getAvailableDomains: async () => requestRepository.findDistinctDomains(),

  getFreelancerDomains: async (freelancerId) =>
    requestRepository.findFreelancerDomains(freelancerId),

  addDomainToFreelancer: async (freelancerId, domain) => {
    await requestRepository.addFreelancerDomain(freelancerId, domain.trim());
    return requestRepository.findFreelancerDomains(freelancerId);
  },

  removeDomainFromFreelancer: async (freelancerId, domain) => {
    const affected = await requestRepository.removeFreelancerDomain(freelancerId, domain);
    if (!affected) throw new AppError("Domaine introuvable pour ce freelancer", 404);
    return requestRepository.findFreelancerDomains(freelancerId);
  },

  getMatchingRequests: async (freelancerId, queryParams) => {
    const { page = 1, limit = 10 } = queryParams;
    const { rows, total } = await requestRepository.findRequestsMatchingFreelancer(
      freelancerId,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    return paginate(rows, total, parseInt(page), parseInt(limit));
  },
};
