import express from "express";
import {
  createRoom,
  getMessages,
  getRoom,
  getWhiteboard,
  history,
  joinRoom,
  updateRoomState
} from "../controllers/roomController.js";
import { listFiles, uploadFile } from "../controllers/fileController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", createRoom);
router.get("/history", history);
router.get("/:roomId", getRoom);
router.post("/:roomId/join", joinRoom);
router.patch("/:roomId/state", updateRoomState);
router.get("/:roomId/messages", getMessages);
router.get("/:roomId/whiteboard", getWhiteboard);
router.post("/:roomId/files", upload.single("file"), uploadFile);
router.get("/:roomId/files", listFiles);

export default router;
