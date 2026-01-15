const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["collaborator"], // فعلاً فقط کولابراتور
      default: "collaborator",
    },

    tokenHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "cancelled"],
      default: "pending",
      index: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);
