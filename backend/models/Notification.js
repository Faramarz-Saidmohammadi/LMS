const mongoose = require("mongoose");

const NOTIF_TYPES = [
  "course_approved",
  "course_rejected",
  "course_published",
  "item_approved",
  "item_rejected",
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIF_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, default: "", trim: true, maxlength: 120 },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
