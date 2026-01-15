const mongoose = require("mongoose");

const CHANGE_TYPES = ["course_details", "curriculum_add", "curriculum_update"];
const CHANGE_STATUS = ["pending", "approved", "rejected", "cancelled"];

const courseChangeRequestSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: CHANGE_TYPES,
      required: true,
      index: true,
    },

    // payload ساختار flexible دارد (برای course_details یا curriculum update/add)
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: CHANGE_STATUS,
      default: "pending",
      index: true,
    },

    // history/review
    adminFeedback: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },

    // when applied
    appliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

courseChangeRequestSchema.index({ courseId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("CourseChangeRequest", courseChangeRequestSchema);
