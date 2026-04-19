import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { roleMiddleware } from "../../middleware/roleMiddleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  banAdminUser,
  deleteAdminUser,
  getAdminReportById,
  getAdminUserByEmail,
  getAdminUserById,
  listAdminReports,
  listAdminUsers,
  closeAdminReport,
  updateAdminReportStatus,
  notifyBannedUserByEmail,
  notifyReporterByEmail,
  unbanAdminUser,
} from "./admin.controller.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("admin"));
// Routes pour la gestion des utilisateurs et des signalements
router.get("/users", asyncHandler(listAdminUsers));
router.get("/users/search", asyncHandler(getAdminUserByEmail));
router.get("/users/:id", asyncHandler(getAdminUserById));
router.patch("/users/:id/ban", asyncHandler(banAdminUser));
router.patch("/users/:id/unban", asyncHandler(unbanAdminUser));
router.delete("/users/:id", asyncHandler(deleteAdminUser));
router.get("/reports", asyncHandler(listAdminReports));
router.get("/reports/:id", asyncHandler(getAdminReportById));
router.patch("/reports/:id/close", asyncHandler(closeAdminReport));
router.patch("/reports/:id/status", asyncHandler(updateAdminReportStatus));
router.post("/reports/:id/notify-banned-user", asyncHandler(notifyBannedUserByEmail));
router.post("/reports/:id/notify-reporter", asyncHandler(notifyReporterByEmail));

export default router;
