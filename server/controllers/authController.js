import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verificationEmailTemplate, passwordResetEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/mailer.js";
import { generateAccessToken, generateRefreshToken, setAuthCookies } from "../utils/generateToken.js";
import { generateOtp, hashOtp, isOtpValid, otpExpiryDate } from "../utils/otp.js";

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    emailVerified: Boolean(user.emailVerified)
  };
}

function withDevelopmentOtp(responseBody, otp, delivery) {
  if (delivery.delivered || process.env.NODE_ENV === "production") return responseBody;
  return { ...responseBody, developmentOtp: otp };
}

async function sendVerificationOtp(user) {
  const otp = generateOtp();
  user.emailVerificationOtpHash = hashOtp(otp);
  user.emailVerificationOtpExpiresAt = otpExpiryDate();
  await user.save();

  const template = verificationEmailTemplate(user.name, otp);
  const delivery = await sendEmail({ to: user.email, ...template });
  return { otp, delivery };
}

async function sendPasswordResetOtp(user) {
  const otp = generateOtp();
  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = otpExpiryDate();
  await user.save();

  const template = passwordResetEmailTemplate(user.name, otp);
  const delivery = await sendEmail({ to: user.email, ...template });
  return { otp, delivery };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ message: "Name, email, and an 8+ character password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      emailVerified: false
    });

    const { otp, delivery } = await sendVerificationOtp(user);
    const responseBody = {
      message: "Account created. Please verify your email with the OTP we sent.",
      email: user.email,
      verificationRequired: true
    };
    res.status(201).json(withDevelopmentOtp(responseBody, otp, delivery));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before signing in.",
        email: user.email
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: publicUser(user), accessToken });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(204).end();
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "Refresh token required" });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: publicUser(user), accessToken });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function resendVerificationOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If that email exists, a verification code has been sent." });
    }

    if (user.emailVerified) {
      return res.json({ message: "This email is already verified." });
    }

    const { otp, delivery } = await sendVerificationOtp(user);
    const responseBody = { message: "A new verification code has been sent.", email: user.email };
    res.json(withDevelopmentOtp(responseBody, otp, delivery));
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Account not found" });
    if (user.emailVerified) return res.json({ message: "Email already verified." });

    if (!isOtpValid(otp, user.emailVerificationOtpHash, user.emailVerificationOtpExpiresAt)) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    user.emailVerified = true;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpiresAt = undefined;
    await user.save();
    res.json({ message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If that email exists, a reset code has been sent." });
    }

    const { otp, delivery } = await sendPasswordResetOtp(user);
    const responseBody = { message: "Password reset code sent.", email: user.email };
    res.json(withDevelopmentOtp(responseBody, otp, delivery));
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password || password.length < 8) {
      return res.status(400).json({ message: "Email, OTP, and an 8+ character password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Account not found" });

    if (!isOtpValid(otp, user.passwordResetOtpHash, user.passwordResetOtpExpiresAt)) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordChangedAt = new Date();
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save();
    res.json({ message: "Password reset successful. You can sign in now." });
  } catch (error) {
    next(error);
  }
}
