const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CurriculumItem",
      },
    ],

    lastAccessed: {
      type: Date,
      default: null,
    },

    // اختیاری ولی خیلی مفید
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// هر شاگرد فقط یکبار در یک کورس enroll شود
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
