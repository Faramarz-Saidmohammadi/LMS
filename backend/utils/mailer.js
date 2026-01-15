const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  // ✅ Dev mode: print email to console instead of sending
  if (String(process.env.MOCK_EMAIL).toLowerCase() === "true") {
    console.log("📧 MOCK EMAIL MODE");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text || "");
    return;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP config is missing in .env (SMTP_HOST/SMTP_USER/SMTP_PASS)");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const from = process.env.FROM_EMAIL || user;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };
