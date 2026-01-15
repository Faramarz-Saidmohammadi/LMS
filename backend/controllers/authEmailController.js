const crypto = require("crypto");
const User = require("../models/User");
const { sendEmail } = require("../utils/emailSender");
const { verifyCodeEmail } = require("../utils/emailTemplates");

const hashCode = (code) => {
  const secret = process.env.SECURITY_SECRET || "secret";
  return crypto.createHash("sha256").update(`${code}:${secret}`).digest("hex");
};

const gen6Digit = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * POST /auth/send-verify-code
 * body: { email }
 */
const sendVerifyCode = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    const code = gen6Digit();
    const codeHash = hashCode(code);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerify = {
      codeHash,
      expiresAt,
      sentAt: new Date(),
    };
    await user.save();

    const tpl = verifyCodeEmail({ name: user.name || "User", code });

    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    return res.status(200).json({ message: "Verification code sent" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/verify-email
 * body: { email, code }
 */
const verifyEmail = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();

    if (!email || !code) return res.status(400).json({ message: "email and code are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    if (!user.emailVerify?.codeHash || !user.emailVerify?.expiresAt) {
      return res.status(400).json({ message: "No verification code found. Please request a new code." });
    }

    if (new Date(user.emailVerify.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "Verification code expired. Please request a new code." });
    }

    const codeHash = hashCode(code);
    if (codeHash !== user.emailVerify.codeHash) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isEmailVerified = true;
    user.emailVerify = { codeHash: "", expiresAt: null, sentAt: null };
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendVerifyCode, verifyEmail };
