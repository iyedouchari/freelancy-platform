import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";
import { validate } from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  changeProposalStatus,
  createProposal,
  getproposalStatus,
  listMyProposals,
  listProposalsByRequest,
  sendClientProposalResponse,
  acceptAndPayProposal,
} from "./proposal.controller.js";
import {
  clientProposalResponseSchema,
  createProposalSchema,
  proposalStatusSchema,
} from "./proposal.validation.js";

const router = Router();

router.get("/status", asyncHandler(getproposalStatus));

router.use(authenticate);

router.get("/my", authorize("freelancer", "admin"), asyncHandler(listMyProposals));
router.get("/request/:requestId", authorize("client", "freelancer", "admin"), asyncHandler(listProposalsByRequest));
router.post("/", authorize("freelancer"), validate(createProposalSchema), asyncHandler(createProposal));
router.patch(
  "/:id/status",
  validate(proposalStatusSchema),
  asyncHandler(changeProposalStatus),
);
router.patch(
  "/:id/client-response",
  validate(clientProposalResponseSchema),
  asyncHandler(sendClientProposalResponse),
);

router.post(
  "/:id/accept-and-pay",
  authorize("client"),
  asyncHandler(acceptAndPayProposal),
);

export default router;
