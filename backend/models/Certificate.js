const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    certificateNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    // لینک قابل دانلود/نمایش
    pdfUrl: {
      type: String,
      default: "",
    },

    // برای اعتماد/تطبیق
    progressSnapshot: {
      progressPercent: { type: Number, default: 0 },
      completedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// هر شاگرد برای هر کورس فقط ۱ سرتیفیکیت
certificateSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
