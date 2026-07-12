import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function masterKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is required");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function deriveRoomKey(roomId) {
  return crypto.createHmac("sha256", masterKey()).update(String(roomId)).digest();
}

export function encryptText(value, roomId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveRoomKey(roomId), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptText(payload, roomId) {
  if (!payload) return "";
  const [iv, tag, encrypted] = payload.split(":").map((part) => Buffer.from(part, "base64"));
  const decipher = crypto.createDecipheriv(ALGORITHM, deriveRoomKey(roomId), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function encryptBuffer(buffer, roomId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveRoomKey(roomId), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

export function decryptBuffer(buffer, roomId) {
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, deriveRoomKey(roomId), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
