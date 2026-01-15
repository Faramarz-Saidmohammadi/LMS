const crypto = require("crypto");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { sendEmail } = require("../utils/mailer");

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const createInvitation = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "email is required" });

    const normalizedEmail = String(email).trim().toLowerCase();

    // اگر قبلاً یوزر موجود باشد، دعوت‌نامه معنی ندارد
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    // اگر دعوت‌نامه pending قبلاً باشد، دوباره نسازیم
    const existingPending = await Invitation.findOne({
      email: normalizedEmail,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingPending) {
      return res.status(409).json({ message: "An active invitation already exists for this email" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      email: normalizedEmail,
      role: "collaborator",
      tokenHash,
      expiresAt,
      status: "pending",
      invitedBy: req.user.userId,
    });

    // لینک فرانت (اگر CLIENT_URL داری)
    const baseUrl = process.env.CLIENT_URL || "";
    const acceptLink = baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/accept-invitation?token=${rawToken}`
      : `TOKEN: ${rawToken}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Invitation to become a collaborator",
      text:
        `You have been invited to join as a collaborator.\n\n` +
        `Accept link:\n${acceptLink}\n\n` +
        `This invitation will expire in 7 days.`,
    });

    return res.status(201).json({
      message: "Invitation sent",
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { createInvitation };
