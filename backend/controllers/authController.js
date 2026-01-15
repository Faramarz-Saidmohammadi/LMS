// const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const { signAccessToken } = require("../utils/jwt");
const { sendEmail } = require("../utils/mailer");

// helpers
const generate6DigitCode = () => String(Math.floor(100000 + Math.random() * 900000));
const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

// ✅ POST /auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = password; // TEMP: no hash for testing

    const user = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      roles: ["student", "collaborator"], // TEMP: make collaborator
      isEmailVerified: false,
    });
    await user.save();

    const token = signAccessToken({ userId: user._id, roles: user.roles });

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ✅ POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = password === user.passwordHash; // TEMP: no hash for testing
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAccessToken({ userId: user._id, roles: user.roles });

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ✅ POST /auth/logout
const logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return next(err);
  }
};

// ✅ POST /auth/send-verify-code  Body: { email }
const sendVerifyCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "email is required" });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+emailVerify.codeHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const now = new Date();
    if (user.emailVerify?.lastSentAt) {
      const diffMs = now - new Date(user.emailVerify.lastSentAt);
      if (diffMs < 60 * 1000) {
        return res.status(429).json({ message: "Please wait 60 seconds before requesting again" });
      }
    }

    const code = generate6DigitCode();
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.emailVerify = {
      codeHash,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
    };

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Your verification code",
      text: `Your verification code is: ${code}\nThis code will expire in 10 minutes.`,
    });

    return res.status(200).json({ message: "Verification code sent" });
  } catch (err) {
    return next(err);
  }
};

// ✅ POST /auth/verify-email  Body: { email, code }
const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "email and code are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+emailVerify.codeHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (!user.emailVerify?.codeHash || !user.emailVerify?.expiresAt) {
      return res.status(400).json({ message: "No verification code found. Please request a new code." });
    }

    if (new Date(user.emailVerify.expiresAt) < new Date()) {
      user.emailVerify = { codeHash: "", expiresAt: null, lastSentAt: user.emailVerify.lastSentAt, attempts: 0 };
      await user.save();
      return res.status(400).json({ message: "Code expired. Please request a new code." });
    }

    const incomingHash = sha256(code);

    if (incomingHash !== user.emailVerify.codeHash) {
      const attempts = (user.emailVerify.attempts || 0) + 1;
      user.emailVerify.attempts = attempts;

      if (attempts >= 5) {
        user.emailVerify.codeHash = "";
        user.emailVerify.expiresAt = null;
        user.emailVerify.attempts = 0;
      }

      await user.save();
      return res.status(400).json({ message: "Invalid code" });
    }

    user.isEmailVerified = true;
    user.emailVerify = { codeHash: "", expiresAt: null, lastSentAt: user.emailVerify.lastSentAt, attempts: 0 };
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ✅ POST /auth/accept-invitation
// Body: { token, name, password }
const acceptInvitation = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return res.status(400).json({ message: "token, name, password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = sha256(token);

    const invitation = await Invitation.findOne({ status: "pending", tokenHash }).select("+tokenHash");
    if (!invitation) {
      return res.status(400).json({ message: "Invalid invitation token" });
    }

    // expiry
    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation expired" });
    }

    // user exists?
    const exists = await User.findOne({ email: invitation.email });
    if (exists) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const passwordHash = password; // TEMP: no hash for testing

    // roles: student + collaborator (دو رول در یک اکانت)
    const roles = ["student", invitation.role];

    const user = new User({
      name: String(name).trim(),
      email: invitation.email,
      passwordHash,
      roles,
      isEmailVerified: false, // مثل ویدیو: بعدش با کُد تایید میشه
    });
    await user.save();

    invitation.status = "accepted";
    invitation.acceptedBy = user._id;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // بعد از ساخت اکانت، خودکار کُد تایید ایمیل هم بفرستیم
    const code = generate6DigitCode();
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerify = {
      codeHash,
      expiresAt,
      lastSentAt: new Date(),
      attempts: 0,
    };
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Your verification code",
      text: `Your verification code is: ${code}\nThis code will expire in 10 minutes.`,
    });

    return res.status(201).json({
      message: "Account created. Verification code sent to email.",
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  sendVerifyCode,
  verifyEmail,
  acceptInvitation,
};
