const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
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

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CurriculumItem",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // ذخیره جواب‌ها (برای تاریخچه)
    // پیشنهاد ساختار: [{ index: 0, answer: "A" }] یا [{ index: 0, answer: 2 }]
    answers: {
      type: Array,
      default: [],
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    maxScore: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
      index: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// جلوگیری از دو رکورد با attemptNumber یکسان برای یک شاگرد و یک کوییز
quizAttemptSchema.index({ studentId: 1, courseId: 1, itemId: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
