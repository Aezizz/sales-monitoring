import express from "express";
import {
  getDashboardSummary,
  getDashboardTrends,
  getDashboardTopProducts,
  getDashboardPlatformComparison
} from "../controllers/dashboard.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/summary", getDashboardSummary);
router.get("/trends", getDashboardTrends);
router.get("/top-products", getDashboardTopProducts);
router.get("/platform-comparison", getDashboardPlatformComparison);

export default router;
