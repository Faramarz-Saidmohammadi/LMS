const mongoose = require("mongoose");

const ITEM_TYPES = ["article", "video", "quiz", "attachment"];
const ITEM_STATUS = ["draft", "under_review", "approved", "rejected"];

const quizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true, maxlength: 800 },
    questionType: { type: String, enum: ["single", "multi"], default: "single" },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "options must have exactly 4 items",
      },
      default: [],
    },
    correctAnswerIndexes: { type: [Number], default: [] },
    score: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const reviewHistorySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["approved", "rejected"], required: true },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const curriculumItemSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSection",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ITEM_TYPES,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
      minlength: 2,
      maxlength: 140,
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    status: {
      type: String,
      enum: ITEM_STATUS,
      default: "draft",
      index: true,
    },

    content: {
      // Article
      articleHtml: { type: String, default: "" },
      articleJson: { type: mongoose.Schema.Types.Mixed, default: null },

      // Video
      youtubeUrl: { type: String, default: "" },
      youtubeVideoId: { type: String, default: "", index: true },
      videoLengthMinutes: { type: Number, default: 0 },
      isUnlistedDeclared: { type: Boolean, default: false },
      notesForAdminUpload: { type: String, default: "", trim: true, maxlength: 800 },

      // Quiz
      quiz: {
        questions: { type: [quizQuestionSchema], default: [] },
      },

      // Attachment
      attachmentUrl: { type: String, default: "" },
      attachmentName: { type: String, default: "" },
    },

    // آخرین پیام رد (برای نمایش سریع)
    rejectFeedback: {
      message: { type: String, default: "", trim: true, maxlength: 2000 },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      at: { type: Date, default: null },
    },

    // ✅ تاریخچه review
    reviewHistory: {
      type: [reviewHistorySchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CurriculumItem", curriculumItemSchema);
