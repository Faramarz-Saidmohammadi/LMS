const escapeHtml = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const baseHtml = ({ title, body }) => {
  const appName = process.env.APP_NAME || "LMS";
  const supportEmail = process.env.SUPPORT_EMAIL || "";

  return `
  <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:24px;">
    <div style="max-width:640px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #eee;">
      <div style="padding:18px 22px; background:#111; color:#fff;">
        <div style="font-size:16px; font-weight:700;">${escapeHtml(appName)}</div>
        <div style="font-size:12px; opacity:0.8;">${escapeHtml(title || "")}</div>
      </div>

      <div style="padding:22px;">
        ${body}
      </div>

      <div style="padding:14px 22px; font-size:12px; color:#666; border-top:1px solid #eee;">
        ${supportEmail ? `Need help? ${escapeHtml(supportEmail)}` : ""}
      </div>
    </div>
  </div>
  `;
};

const verifyCodeEmail = ({ name = "User", code }) => {
  const appName = process.env.APP_NAME || "LMS";
  const subject = `${appName} - Verify your email`;
  const text = `Your verification code is: ${code}`;

  const body = `
    <p style="margin:0 0 10px;">Hi <b>${escapeHtml(name)}</b>,</p>
    <p style="margin:0 0 14px;">Use this code to verify your email:</p>
    <div style="font-size:28px; font-weight:800; letter-spacing:6px; padding:14px; background:#f3f4f6; border-radius:10px; text-align:center;">
      ${escapeHtml(code)}
    </div>
    <p style="margin:14px 0 0; color:#555; font-size:12px;">This code will expire in 10 minutes.</p>
  `;

  return { subject, text, html: baseHtml({ title: "Email Verification", body }) };
};

const invitationEmail = ({ email, role, acceptUrl }) => {
  const appName = process.env.APP_NAME || "LMS";
  const subject = `${appName} - Invitation to join as ${role}`;
  const text = `You have been invited to join ${appName} as ${role}. Accept: ${acceptUrl}`;

  const body = `
    <p style="margin:0 0 10px;">Hello <b>${escapeHtml(email)}</b>,</p>
    <p style="margin:0 0 12px;">You have been invited to join <b>${escapeHtml(appName)}</b> as <b>${escapeHtml(role)}</b>.</p>

    <a href="${acceptUrl}" style="display:inline-block; padding:12px 16px; background:#2563eb; color:#fff; text-decoration:none; border-radius:10px; font-weight:700;">
      Accept Invitation
    </a>

    <p style="margin:12px 0 0; font-size:12px; color:#666;">
      If the button does not work, copy and paste this link:<br/>
      <span style="word-break:break-all;">${acceptUrl}</span>
    </p>

    <p style="margin:12px 0 0; font-size:12px; color:#666;">This invitation link will expire in 72 hours.</p>
  `;

  return { subject, text, html: baseHtml({ title: "Invitation", body }) };
};

// ✅ NEW: reset password email
const resetPasswordEmail = ({ name = "User", resetUrl }) => {
  const appName = process.env.APP_NAME || "LMS";
  const subject = `${appName} - Reset your password`;
  const text = `Reset your password using this link: ${resetUrl}`;

  const body = `
    <p style="margin:0 0 10px;">Hi <b>${escapeHtml(name)}</b>,</p>
    <p style="margin:0 0 12px;">We received a request to reset your password.</p>

    <a href="${resetUrl}" style="display:inline-block; padding:12px 16px; background:#16a34a; color:#fff; text-decoration:none; border-radius:10px; font-weight:700;">
      Reset Password
    </a>

    <p style="margin:12px 0 0; font-size:12px; color:#666;">
      If the button does not work, copy and paste this link:<br/>
      <span style="word-break:break-all;">${resetUrl}</span>
    </p>

    <p style="margin:12px 0 0; font-size:12px; color:#666;">
      This link will expire in 15 minutes. If you didn’t request this, you can ignore this email.
    </p>
  `;

  return { subject, text, html: baseHtml({ title: "Reset Password", body }) };
};

module.exports = {
  verifyCodeEmail,
  invitationEmail,
  resetPasswordEmail,
};
