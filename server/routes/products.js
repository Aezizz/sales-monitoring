import express from "express";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../controllers/products.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getProducts);
router.post("/", requireRole(["SUPER_ADMIN", "STAFF"]), createProduct);
router.put("/:id", requireRole(["SUPER_ADMIN", "STAFF"]), updateProduct);
router.delete("/:id", requireRole(["SUPER_ADMIN", "STAFF"]), deleteProduct);

export default router;
