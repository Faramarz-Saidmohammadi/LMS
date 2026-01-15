const nodemailer = require("nodemailer");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP config missing. Please set SMTP_HOST/SMTP_USER/SMTP_PASS in .env");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const disabled = String(process.env.EMAIL_DISABLED || "false") === "true";
  if (disabled) {
    console.log("📨 EMAIL_DISABLED=true -> skip sending email, logging only:", { to, subject });
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();

  // verify connection (helps detect wrong credentials early)
  try {
    await transporter.verify();
  } catch (err) {
    console.error("❌ SMTP verify failed:", err.message);
    throw err;
  }

  const mailOptions = { from, to, subject, html, text };

  const maxAttempts = 3;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to} | subject="${subject}" | messageId=${info.messageId}`);
      return info;
    } catch (err) {
      lastErr = err;
      console.error(`❌ Email send failed (attempt ${attempt}/${maxAttempts}):`, err.message);
      if (attempt < maxAttempts) await sleep(700 * attempt);
    }
  }

  throw lastErr;
};

module.exports = { sendEmail };
