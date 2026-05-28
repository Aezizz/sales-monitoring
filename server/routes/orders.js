import express from "express";
import {
  getAllOrders,
  updateOrder,
  deleteOrder
} from "../controllers/orders.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);
// Only SUPER_ADMIN can access these routes
router.use(requireRole(["SUPER_ADMIN"]));

router.get("/", getAllOrders);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
