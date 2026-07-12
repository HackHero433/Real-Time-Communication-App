import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  me,
  refresh,
  register,
  requestPasswordReset,
  resendVerificationOtp,
  resetPassword,
  verifyEmailOtp
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 25 });

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/verify-email", authLimiter, verifyEmailOtp);
router.post("/verify-email/resend", authLimiter, resendVerificationOtp);
router.post("/forgot-password", authLimiter, requestPasswordReset);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", requireAuth, me);

export default router;
