const crypto = require("crypto");
const Invitation = require("../models/Invitation");
const { sendEmail } = require("../utils/emailSender");
const { invitationEmail } = require("../utils/emailTemplates");

const hashToken = (token) => {
  const secret = process.env.SECURITY_SECRET || "secret";
  return crypto.createHash("sha256").update(`${token}:${secret}`).digest("hex");
};

// POST /admin/invitations
// body: { email, role }  (role default collaborator)
const createInvitation = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = String(req.body.role || "collaborator").trim();

    if (!email) return res.status(400).json({ message: "email is required" });
    if (role !== "collaborator") return res.status(400).json({ message: "Only collaborator role is supported" });

    // توکن خام که فقط برای ایمیل است
    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

    // اگر دعوت pending موجود باشد، همان را آپدیت کن
    let inv = await Invitation.findOne({ email, status: "pending" });

    if (inv) {
      inv.tokenHash = tokenHash;
      inv.expiresAt = expiresAt;
      inv.invitedBy = req.user.userId;
      await inv.save();
    } else {
      inv = await Invitation.create({
        email,
        role,
        tokenHash,
        expiresAt,
        status: "pending",
        invitedBy: req.user.userId,
      });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const acceptUrl = `${clientUrl}/accept-invitation?token=${rawToken}`;

    const tpl = invitationEmail({ email, role, acceptUrl });

    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    return res.status(201).json({
      message: "Invitation sent",
      invitation: {
        id: inv._id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createInvitation };
