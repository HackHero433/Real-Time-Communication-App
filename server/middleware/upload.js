import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = path.resolve(__dirname, "../uploads/tmp");
fs.mkdirSync(tmpDir, { recursive: true });

export const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 50 * 1024 * 1024 }
});
