import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies.accessToken || header;
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function getSocketUser(socket, next) {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").filter(Boolean).map((part) => {
        const [key, ...value] = part.trim().split("=");
        return [key, decodeURIComponent(value.join("="))];
      })
    );
    const token = socket.handshake.auth?.token || cookies.accessToken;
    if (!token) return next(new Error("Authentication required"));
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(new Error("Invalid socket token"));
  }
}
