import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { analyzeFile, processImport, getImportHistory } from "../controllers/import.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const uploadDir = "server/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Config Multer Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (_req, file, cb) => {
  const filetypes = /csv|xlsx|xls|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-excel|text\/csv/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) {
    return cb(null, true);
  }
  cb(new Error("Only CSV and Excel files (.xlsx, .xls) are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

router.use(authenticateToken);

router.post("/analyze", requireRole(["SUPER_ADMIN", "STAFF"]), upload.single("file"), analyzeFile);
router.post("/process", requireRole(["SUPER_ADMIN", "STAFF"]), processImport);
router.get("/history", getImportHistory);

export default router;
