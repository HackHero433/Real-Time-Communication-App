import nodemailer from "nodemailer";

let transporter;

function createTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const mailTransport = createTransporter();
  if (!mailTransport) {
    console.log(`[email:dev] ${subject} -> ${to}\n${text}`);
    return { delivered: false };
  }

  await mailTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });

  return { delivered: true };
}
