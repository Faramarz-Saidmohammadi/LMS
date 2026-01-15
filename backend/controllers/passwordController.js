const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const User = require("../models/User");
const { sendEmail } = require("../utils/emailSender");
const { resetPasswordEmail } = require("../utils/emailTemplates");

const hashToken = (rawToken) => {
  const secret = process.env.SECURITY_SECRET || "secret";
  return crypto.createHash("sha256").update(`${rawToken}:${secret}`).digest("hex");
};

const genToken = () => crypto.randomBytes(24).toString("hex");

// POST /auth/forgot-password
// body: { email }
const forgotPassword = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const email = parsed.data.email.trim().toLowerCase();

    // ✅ برای جلوگیری از لو رفتن اکانت: همیشه جواب یکسان
    const genericResponse = {
      message: "If the email exists, a reset link has been sent.",
    };

    const user = await User.findOne({ email });
    if (!user || user.isActive === false) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = genToken();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    user.resetPassword = {
      tokenHash,
      expiresAt,
      lastSentAt: new Date(),
      attempts: 0,
    };

    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    const tpl = resetPasswordEmail({ name: user.name || "User", resetUrl });

    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    return res.status(200).json(genericResponse);
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password
// body: { token, newPassword }
const resetPassword = async (req, res, next) => {
  try {
    const schema = z.object({
      token: z.string().min(10),
      newPassword: z.string().min(8).max(72),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid token or password" });
    }

    const rawToken = parsed.data.token.trim();
    const newPassword = parsed.data.newPassword;

    const tokenHash = hashToken(rawToken);

    // چون tokenHash در select:false است، باید explicitly select شود
    const user = await User.findOne({ "resetPassword.tokenHash": tokenHash }).select(
      "+passwordHash +resetPassword.tokenHash"
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (!user.resetPassword?.expiresAt || new Date(user.resetPassword.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "Reset token expired. Please request a new one." });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = newPassword; // await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.resetPassword = {
      tokenHash: "",
      expiresAt: null,
      lastSentAt: null,
      attempts: 0,
    };

    await user.save();

    return res.status(200).json({ message: "Password reset successful. You can now login." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};
