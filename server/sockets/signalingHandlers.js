import Room from "../models/Room.js";
import Message from "../models/Message.js";
import WhiteboardSnapshot from "../models/WhiteboardSnapshot.js";
import { decryptText, encryptText } from "../utils/encryption.js";

const presence = new Map();
const strokesByRoom = new Map();

export function registerSignalingHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("join-room", async ({ roomId, mediaState = {} }) => {
      const room = await Room.findOne({ roomId });
      if (!room) return socket.emit("room:error", { message: "Room not found" });

      const roomName = `room:${roomId}`;
      const existing = getParticipants(roomId);
      presence.set(socket.id, {
        socketId: socket.id,
        userId: socket.user.id,
        email: socket.user.email,
        roomId,
        mediaState: { muted: false, cameraOff: false, screenSharing: false, speaking: false, ...mediaState }
      });
      socket.join(roomName);
      socket.emit("room:participants", existing);
      socket.to(roomName).emit("user:joined", presence.get(socket.id));
    });

    socket.on("leave-room", () => leaveCurrentRoom(io, socket));

    socket.on("signal:offer", ({ to, offer }) => {
      io.to(to).emit("signal:offer", { from: socket.id, offer });
    });

    socket.on("signal:answer", ({ to, answer }) => {
      io.to(to).emit("signal:answer", { from: socket.id, answer });
    });

    socket.on("signal:ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("signal:ice-candidate", { from: socket.id, candidate });
    });

    socket.on("media:state", (mediaState) => {
      const participant = presence.get(socket.id);
      if (!participant) return;
      participant.mediaState = { ...participant.mediaState, ...mediaState };
      io.to(`room:${participant.roomId}`).emit("media:state", {
        socketId: socket.id,
        userId: participant.userId,
        mediaState: participant.mediaState
      });
    });

    socket.on("screen-share:start", ({ roomId, userId }) => {
      io.to(`room:${roomId}`).emit("screen-share:start", { socketId: socket.id, userId });
    });

    socket.on("screen-share:stop", ({ roomId, userId }) => {
      io.to(`room:${roomId}`).emit("screen-share:stop", { socketId: socket.id, userId });
    });

    socket.on("chat:message", async ({ roomId, text }) => {
      const room = await Room.findOne({ roomId });
      if (!room || !text?.trim()) return;
      const message = await Message.create({
        room: room._id,
        sender: socket.user.id,
        text: encryptText(text.trim(), roomId)
      });
      io.to(`room:${roomId}`).emit("chat:message", {
        id: message._id,
        sender: { _id: socket.user.id, email: socket.user.email },
        text: decryptText(message.text, roomId),
        createdAt: message.createdAt
      });
    });

    socket.on("whiteboard:draw", async ({ roomId, stroke }) => {
      const room = await Room.findOne({ roomId });
      if (!room || !stroke) return;
      const strokes = await getCachedStrokes(room._id, roomId);
      strokes.push(stroke);
      strokesByRoom.set(roomId, strokes);
      socket.to(`room:${roomId}`).emit("whiteboard:draw", stroke);
      await WhiteboardSnapshot.findOneAndUpdate(
        { room: room._id },
        { room: room._id, strokes, savedAt: new Date() },
        { upsert: true, new: true }
      );
    });

    socket.on("whiteboard:clear", async ({ roomId }) => {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      strokesByRoom.set(roomId, []);
      io.to(`room:${roomId}`).emit("whiteboard:clear");
      await WhiteboardSnapshot.findOneAndUpdate(
        { room: room._id },
        { room: room._id, strokes: [], savedAt: new Date() },
        { upsert: true, new: true }
      );
    });

    socket.on("whiteboard:undo", async ({ roomId }) => {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      const strokes = await getCachedStrokes(room._id, roomId);
      strokes.pop();
      strokesByRoom.set(roomId, strokes);
      socket.to(`room:${roomId}`).emit("whiteboard:undo");
      await WhiteboardSnapshot.findOneAndUpdate(
        { room: room._id },
        { room: room._id, strokes, savedAt: new Date() },
        { upsert: true, new: true }
      );
    });

    socket.on("file:shared", ({ roomId, fileMeta }) => {
      socket.to(`room:${roomId}`).emit("file:shared", fileMeta);
    });

    socket.on("disconnect", () => leaveCurrentRoom(io, socket));
  });
}

function getParticipants(roomId) {
  return [...presence.values()].filter((participant) => participant.roomId === roomId);
}

async function getCachedStrokes(roomObjectId, roomId) {
  if (strokesByRoom.has(roomId)) return strokesByRoom.get(roomId);
  const snapshot = await WhiteboardSnapshot.findOne({ room: roomObjectId }).sort({ savedAt: -1 }).lean();
  const strokes = snapshot?.strokes || [];
  strokesByRoom.set(roomId, strokes);
  return strokes;
}

function leaveCurrentRoom(io, socket) {
  const participant = presence.get(socket.id);
  if (!participant) return;
  presence.delete(socket.id);
  socket.to(`room:${participant.roomId}`).emit("user:left", {
    socketId: socket.id,
    userId: participant.userId
  });
  socket.leave(`room:${participant.roomId}`);
}
