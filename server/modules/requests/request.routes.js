import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";
import { validate } from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  addMyDomain,
  changeStatus,
  createRequest,
  deleteRequest,
  getAllRequests,
  getAvailableDomains,
  getMatchingRequests,
  getMyDomains,
  getMyRequests,
  getrequestStatus,
  getRequestById,
  removeMyDomain,
  updateRequest,
} from "./request.controller.js";
import {
  changeStatusSchema,
  createRequestSchema,
  domainBodySchema,
  domainParamSchema,
  filterRequestSchema,
  idParamSchema,
  updateRequestSchema,
} from "./request.validation.js";

const router = Router();

router.get("/status", asyncHandler(getrequestStatus));

router.use(authenticate);

router.get("/domains", asyncHandler(getAvailableDomains));
router.get("/my", authorize("client", "admin"), asyncHandler(getMyRequests));
router.get("/freelancer/domains", authorize("freelancer"), asyncHandler(getMyDomains));
router.post(
  "/freelancer/domains",
  authorize("freelancer"),
  validate(domainBodySchema),
  asyncHandler(addMyDomain),
);
router.delete(
  "/freelancer/domains/:domain",
  authorize("freelancer"),
  validate(domainParamSchema, "params"),
  asyncHandler(removeMyDomain),
);
router.get("/matching", authorize("freelancer"), validate(filterRequestSchema, "query"), asyncHandler(getMatchingRequests));
router.get("/", validate(filterRequestSchema, "query"), asyncHandler(getAllRequests));
router.post("/", authorize("client"), validate(createRequestSchema), asyncHandler(createRequest));
router.get("/:id", validate(idParamSchema, "params"), asyncHandler(getRequestById));
router.put(
  "/:id",
  authorize("client", "admin"),
  validate(idParamSchema, "params"),
  validate(updateRequestSchema),
  asyncHandler(updateRequest),
);
router.patch(
  "/:id/status",
  authorize("client", "admin"),
  validate(idParamSchema, "params"),
  validate(changeStatusSchema),
  asyncHandler(changeStatus),
);
router.delete(
  "/:id",
  authorize("client", "admin"),
  validate(idParamSchema, "params"),
  asyncHandler(deleteRequest),
);

export default router;
