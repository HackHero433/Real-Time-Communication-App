import { otpExpiryMinutes } from "./otp.js";

export function verificationEmailTemplate(name, otp) {
  const title = "Verify your account";
  const greeting = name ? `Hi ${name},` : "Hi,";
  const text = `${greeting}\n\nYour verification code is ${otp}. It expires in ${otpExpiryMinutes()} minutes.\n\nIf you did not create this account, you can ignore this email.`;
  const html = `<p>${greeting}</p><p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in ${otpExpiryMinutes()} minutes.</p><p>If you did not create this account, you can ignore this email.</p>`;
  return { subject: title, text, html };
}

export function passwordResetEmailTemplate(name, otp) {
  const title = "Reset your password";
  const greeting = name ? `Hi ${name},` : "Hi,";
  const text = `${greeting}\n\nYour password reset code is ${otp}. It expires in ${otpExpiryMinutes()} minutes.\n\nIf you did not request a reset, you can ignore this email.`;
  const html = `<p>${greeting}</p><p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in ${otpExpiryMinutes()} minutes.</p><p>If you did not request a reset, you can ignore this email.</p>`;
  return { subject: title, text, html };
}
