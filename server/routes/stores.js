import express from "express";
import { getStores, createStore, updateStore, deleteStore } from "../controllers/stores.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getStores);
router.post("/", requireRole(["SUPER_ADMIN", "STAFF"]), createStore);
router.put("/:id", requireRole(["SUPER_ADMIN", "STAFF"]), updateStore);
router.delete("/:id", requireRole(["SUPER_ADMIN", "STAFF"]), deleteStore);

export default router;
