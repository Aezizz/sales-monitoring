import express from "express";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionsAnalytics
} from "../controllers/promotions.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getPromotions);
router.get("/analytics", getPromotionsAnalytics);
router.post("/", requireRole(["SUPER_ADMIN", "STAFF"]), createPromotion);
router.put("/:id", requireRole(["SUPER_ADMIN", "STAFF"]), updatePromotion);
router.delete("/:id", requireRole(["SUPER_ADMIN", "STAFF"]), deletePromotion);

export default router;
