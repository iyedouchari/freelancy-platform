import { sendSuccess, successResponse } from "../../utils/apiResponse.js";
import { proposalService } from "./proposal.service.js";
// Permet de vérifier que le module de propositions est opérationnel et de fournir des informations sur les routes disponibles
export const getproposalStatus = async (_req, res) => {
  return successResponse(res, {
    message: "proposals module is ready.",
    data: {
      routes: [
        "GET /api/proposals/my",
        "GET /api/proposals/request/:requestId",
        "POST /api/proposals",
        "PATCH /api/proposals/:id/status",
      ],
    },
  });
};
// Permet de récupérer la liste des propositions liées à l'utilisateur connecté, en fonction de son rôle (client ou freelancer), et de retourner les résultats avec un message de succès
export const listMyProposals = async (req, res) => {
  const proposals = await proposalService.listMine(req.user.id, req.user.role);
  return sendSuccess(res, proposals, "Liste de vos propositions.");
};
// Permet de récupérer la liste des propositions liées à une demande spécifique, en effectuant une requête pour obtenir les propositions associées au requestId fourni, et en retournant les résultats avec un message de succès
export const listProposalsByRequest = async (req, res) => {
  const proposals = await proposalService.listByRequest(req.params.requestId);
  return sendSuccess(res, proposals, "Liste des propositions.");
};
// Permet de créer une nouvelle proposition en utilisant les informations fournies dans le corps de la requête, et en associant la proposition à l'utilisateur connecté, puis en retournant la proposition créée avec un message de succès
export const createProposal = async (req, res) => {
  const proposal = await proposalService.createProposal(req.user, req.body);
  return sendSuccess(res, proposal, "Proposition envoyee.", 201);
};
// Permet de changer le statut d'une proposition spécifique en utilisant les informations fournies dans le corps de la requête, et en vérifiant que l'utilisateur connecté a les droits nécessaires pour effectuer cette action, puis en retournant le résultat avec un message de succès
export const changeProposalStatus = async (req, res) => {
  const result = await proposalService.changeStatus(
    req.params.id,
    req.body.status,
    req.user.id,
    req.user.role,
  );

  return sendSuccess(res, result, "Statut de la proposition mis a jour.");
};
// Permet d'envoyer une réponse à une proposition en tant que client, en utilisant les informations fournies dans le corps de la requête, et en vérifiant que l'utilisateur connecté est bien le client associé à la proposition, puis en retournant le résultat avec un message de succès
export const sendClientProposalResponse = async (req, res) => {
  const proposal = await proposalService.sendClientResponse(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body,
  );

  return sendSuccess(res, proposal, "Reponse client enregistree.");
};
// Permet d'accepter une proposition en tant que client, ce qui implique de changer le statut de la proposition, de créer un deal associé, et de déclencher le paiement de l'avance, en vérifiant que l'utilisateur connecté est bien le client associé à la proposition, puis en retournant le résultat avec un message de succès
export const acceptAndPayProposal = async (req, res) => {
  const result = await proposalService.acceptAndPay(
    req.params.id,
    req.user.id,
    req.user.role,
  );

  return sendSuccess(res, result, "Proposition acceptee et avance payee.");
};
