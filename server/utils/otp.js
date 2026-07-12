import crypto from "crypto";

const OTP_TTL_MINUTES = 10;

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export function otpExpiryDate() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export function isOtpValid(plainOtp, hashedOtp, expiresAt) {
  if (!plainOtp || !hashedOtp || !expiresAt) return false;
  if (new Date(expiresAt).getTime() < Date.now()) return false;
  return hashOtp(plainOtp) === hashedOtp;
}

export function otpExpiryMinutes() {
  return OTP_TTL_MINUTES;
}
