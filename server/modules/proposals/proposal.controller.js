import { sendSuccess, successResponse } from "../../utils/apiResponse.js";
import { proposalService } from "./proposal.service.js";

export const getproposalStatus = async (_req, res) => {
  return successResponse(res, {
    message: "proposals module is ready.",
    data: {
      routes: [
        "GET /api/proposals/request/:requestId",
        "POST /api/proposals",
        "PATCH /api/proposals/:id/status",
      ],
    },
  });
};

export const listProposalsByRequest = async (req, res) => {
  const proposals = await proposalService.listByRequest(req.params.requestId);
  return sendSuccess(res, proposals, "Liste des propositions.");
};

export const createProposal = async (req, res) => {
  const proposal = await proposalService.createProposal(req.user, req.body);
  return sendSuccess(res, proposal, "Proposition envoyee.", 201);
};

export const changeProposalStatus = async (req, res) => {
  const proposal = await proposalService.changeStatus(
    req.params.id,
    req.body.status,
    req.user.id,
    req.user.role,
  );

  return sendSuccess(res, proposal, "Statut de la proposition mis a jour.");
};

export const sendClientProposalResponse = async (req, res) => {
  const proposal = await proposalService.sendClientResponse(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body,
  );

  return sendSuccess(res, proposal, "Reponse client enregistree.");
};
