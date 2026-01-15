const mongoose = require("mongoose");

const USER_ROLES = ["admin", "collaborator", "student"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name is too long"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },

    roles: {
      type: [String],
      enum: USER_ROLES,
      default: ["student"],
    },

    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // ✅ Email verification code (hashed) + expiry
    emailVerify: {
      codeHash: { type: String, default: "", select: false },
      expiresAt: { type: Date, default: null },
      lastSentAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
    },

    // ✅ Forgot/Reset Password token (hashed) + expiry
    resetPassword: {
      tokenHash: { type: String, default: "", select: false, index: true },
      expiresAt: { type: Date, default: null },
      lastSentAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// userSchema.pre("save", function(next) {
//   if (this.roles && Array.isArray(this.roles)) {
//     this.roles = [...new Set(this.roles)];
//   }
//   next();
// });

module.exports = mongoose.model("User", userSchema);
