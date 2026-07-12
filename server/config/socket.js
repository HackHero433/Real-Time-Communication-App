import { Server } from "socket.io";
import { getSocketUser } from "../middleware/auth.js";
import { registerSignalingHandlers } from "../sockets/signalingHandlers.js";

export function configureSocket(server, app) {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.use(getSocketUser);
  registerSignalingHandlers(io);
  app.set("io", io);
  return io;
}
