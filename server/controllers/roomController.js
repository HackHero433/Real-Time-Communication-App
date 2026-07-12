import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import WhiteboardSnapshot from "../models/WhiteboardSnapshot.js";
import { decryptText } from "../utils/encryption.js";

function roomCode() {
  return uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function roomPayload(room) {
  return {
    id: room._id,
    roomId: room.roomId,
    name: room.name,
    host: room.host,
    isLocked: room.isLocked,
    recordingActive: room.recordingActive,
    participants: room.participants,
    createdAt: room.createdAt
  };
}

export async function createRoom(req, res, next) {
  try {
    const { name, joinPassword } = req.body;
    const room = await Room.create({
      roomId: roomCode(),
      name: name || "Untitled meeting",
      host: req.user._id,
      joinPasswordHash: joinPassword ? await bcrypt.hash(joinPassword, 12) : undefined,
      participants: [{ user: req.user._id }]
    });
    res.status(201).json({ room: roomPayload(room) });
  } catch (error) {
    next(error);
  }
}

export async function getRoom(req, res, next) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate("host", "name email");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ room: roomPayload(room), requiresPassword: Boolean(room.joinPasswordHash) });
  } catch (error) {
    next(error);
  }
}

export async function joinRoom(req, res, next) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.isLocked && String(room.host) !== String(req.user._id)) {
      return res.status(423).json({ message: "Room is locked. Host approval is required." });
    }
    if (room.joinPasswordHash) {
      const valid = await bcrypt.compare(req.body.joinPassword || "", room.joinPasswordHash);
      if (!valid) return res.status(403).json({ message: "Invalid room password" });
    }
    const participant = room.participants.find((entry) => String(entry.user) === String(req.user._id) && !entry.leftAt);
    if (!participant) room.participants.push({ user: req.user._id });
    await room.save();
    res.json({ room: roomPayload(room) });
  } catch (error) {
    next(error);
  }
}

export async function history(req, res, next) {
  try {
    const rooms = await Room.find({
      $or: [{ host: req.user._id }, { "participants.user": req.user._id }]
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({
      rooms: rooms.map((room) => ({
        roomId: room.roomId,
        name: room.name,
        createdAt: room.createdAt,
        endedAt: room.endedAt,
        participantCount: room.participants.length
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoomState(req, res, next) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (String(room.host) !== String(req.user._id)) return res.status(403).json({ message: "Host only" });
    if (typeof req.body.isLocked === "boolean") room.isLocked = req.body.isLocked;
    if (typeof req.body.recordingActive === "boolean") room.recordingActive = req.body.recordingActive;
    await room.save();
    req.app.get("io").to(`room:${room.roomId}`).emit("room:state", {
      isLocked: room.isLocked,
      recordingActive: room.recordingActive
    });
    res.json({ room: roomPayload(room) });
  } catch (error) {
    next(error);
  }
}

export async function getWhiteboard(req, res, next) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const snapshot = await WhiteboardSnapshot.findOne({ room: room._id }).sort({ savedAt: -1 });
    res.json({ strokes: snapshot?.strokes || [] });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req, res, next) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const messages = await Message.find({ room: room._id }).populate("sender", "name").sort({ createdAt: 1 }).limit(100);
    res.json({
      messages: messages.map((message) => ({
        id: message._id,
        sender: message.sender,
        text: decryptText(message.text, room.roomId),
        createdAt: message.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}
