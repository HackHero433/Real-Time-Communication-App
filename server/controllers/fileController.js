import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import SharedFile from "../models/SharedFile.js";
import Room from "../models/Room.js";
import { decryptBuffer, encryptBuffer } from "../utils/encryption.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../uploads/encrypted");
await fs.mkdir(uploadDir, { recursive: true });

export async function uploadFile(req, res, next) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!req.file) return res.status(400).json({ message: "File is required" });

    const raw = await fs.readFile(req.file.path);
    const encrypted = encryptBuffer(raw, room.roomId);
    const filename = `${Date.now()}-${req.file.filename}.enc`;
    const encryptedPath = path.join(uploadDir, filename);
    await fs.writeFile(encryptedPath, encrypted);
    await fs.unlink(req.file.path);

    const sharedFile = await SharedFile.create({
      room: room._id,
      uploadedBy: req.user._id,
      filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: encryptedPath
    });

    const fileMeta = toFileMeta(sharedFile);
    req.app.get("io").to(`room:${room.roomId}`).emit("file:shared", fileMeta);
    res.status(201).json({ file: fileMeta });
  } catch (error) {
    next(error);
  }
}

export async function listFiles(req, res, next) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const files = await SharedFile.find({ room: room._id }).sort({ createdAt: -1 }).populate("uploadedBy", "name");
    res.json({ files: files.map(toFileMeta) });
  } catch (error) {
    next(error);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const file = await SharedFile.findById(req.params.fileId).populate("room");
    if (!file) return res.status(404).json({ message: "File not found" });
    const encrypted = await fs.readFile(file.path);
    const decrypted = decryptBuffer(encrypted, file.room.roomId);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(decrypted);
  } catch (error) {
    next(error);
  }
}

function toFileMeta(file) {
  return {
    id: file._id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt
  };
}
