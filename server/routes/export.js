import express from "express";
import { exportCSV, exportXLSX, exportPDF, scheduleReport } from "../controllers/export.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/csv", exportCSV);
router.post("/xlsx", exportXLSX);
router.post("/pdf", exportPDF);
router.post("/schedule", scheduleReport);

export default router;
