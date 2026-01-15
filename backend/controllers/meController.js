const bcrypt = require("bcryptjs");
const { z } = require("zod");

const User = require("../models/User");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const updateProfile = async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(60).optional(),
    });

    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const userId = req.user.userId;

    // چون passwordHash select:false هست، لازم نیست اینجا select کنیم
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // name update
    if (typeof parsed.data.name === "string") {
      user.name = parsed.data.name.trim();
    }

    // avatar update (optional file)
    if (req.file) {
      // اگر Cloudinary config ناقص باشد
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({ message: "Cloudinary config missing in .env" });
      }

      const folder = process.env.CLOUDINARY_FOLDER || "lms/avatars";

      // اگر قبلاً آواتار داشته، حذفش کن
      const oldPublicId = user.avatar?.publicId || "";
      if (oldPublicId) {
        try {
          await deleteFromCloudinary({ publicId: oldPublicId, resourceType: "image" });
        } catch (e) {
          // خطای حذف را بلاک نکنیم
          console.log("⚠️ Could not delete old avatar:", e.message);
        }
      }

      const uploadResult = await uploadBufferToCloudinary({
        buffer: req.file.buffer,
        folder,
        resourceType: "image",
      });

      user.avatar = {
        url: uploadResult.secure_url || "",
        publicId: uploadResult.public_id || "",
      };
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(6).max(72),
      newPassword: z.string().min(8).max(72),
    });

    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const userId = req.user.userId;

    // چون passwordHash select:false هست، باید select کنیم
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = parsed.data.currentPassword === user.passwordHash; // await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // جلوگیری از گذاشتن پسورد تکراری
    const same = parsed.data.newPassword === user.passwordHash; // await bcrypt.compare(parsed.data.newPassword, user.passwordHash);
    if (same) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    // const salt = await bcrypt.genSalt(10);
    user.passwordHash = parsed.data.newPassword; // await bcrypt.hash(parsed.data.newPassword, salt);

    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProfile,
  changePassword,
};
