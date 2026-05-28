import express from "express";
import {
  getCorrections,
  createCorrectionRequest,
  approveCorrection,
  rejectCorrection,
  getAuditLogs
} from "../controllers/corrections.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getCorrections);
router.post("/", requireRole(["SUPER_ADMIN", "STAFF"]), createCorrectionRequest);
router.put("/:id/approve", requireRole(["SUPER_ADMIN"]), approveCorrection);
router.put("/:id/reject", requireRole(["SUPER_ADMIN"]), rejectCorrection);
router.get("/audit-logs", getAuditLogs);

export default router;
