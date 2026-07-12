import express from "express";
import { downloadFile } from "../controllers/fileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.get("/:fileId/download", downloadFile);

export default router;
