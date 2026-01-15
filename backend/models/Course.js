const mongoose = require("mongoose");

const COURSE_STATUS = ["draft", "under_review", "rejected", "approved", "published"];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },

    shortDesc: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      minlength: 10,
      maxlength: 400,
    },

    startDate: {
      type: Date,
      default: null,
    },

    duration: {
      type: String, // مثال: "4 weeks" یا "10 hours"
      default: "",
      trim: true,
      maxlength: 60,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: COURSE_STATUS,
      default: "draft",
      index: true,
    },

    feedback: [
      {
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        at: { type: Date, default: Date.now },
      },
    ],

    publishedAt: {
      type: Date,
      default: null,
      index: true, // ✅ برای sort سریع published
    },

    // ✅ قفل بعد از نشر
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ✅ اگر بعد از نشر تغییر خواستی، این فیلد می‌گوید کورس نیازمند ریویو مجدد است
    needsReReview: {
      type: Boolean,
      default: false,
      index: true,
    },

    // برای track کردن چه چیزهایی تغییر کرده (اختیاری اما مفید)
    lockedFields: {
      type: [String],
      default: [],
    },

    /**
     * ✅ Stats برای لیست‌ها (Stage 28)
     * این باعث می‌شود sort های “rating” و “students” سریع باشد
     * بعداً وقتی Review/Enrollment ساختی، همین‌ها را آپدیت می‌کنی
     */
    stats: {
      enrolledCount: { type: Number, default: 0, index: true },
      avgRating: { type: Number, default: 0, index: true },
      ratingCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ✅ Text Search index (برای search حرفه‌ای)
courseSchema.index(
  { title: "text", shortDesc: "text" },
  { weights: { title: 10, shortDesc: 3 }, name: "course_text_search" }
);

// ✅ Index های مهم برای performance لیست‌ها
courseSchema.index({ status: 1, createdAt: -1 }, { name: "status_createdAt" });
courseSchema.index({ status: 1, publishedAt: -1 }, { name: "status_publishedAt" });
courseSchema.index({ category: 1, status: 1, createdAt: -1 }, { name: "category_status_createdAt" });
courseSchema.index({ instructorId: 1, status: 1, createdAt: -1 }, { name: "instructor_status_createdAt" });

// ✅ Index های sort اختیاری (خیلی مفید)
courseSchema.index({ "stats.enrolledCount": -1, createdAt: -1 }, { name: "enrolled_sort" });
courseSchema.index({ "stats.avgRating": -1, createdAt: -1 }, { name: "rating_sort" });

// اگر published شد، خودکار lock شود
courseSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "published") {
    this.isLocked = true;
    this.publishedAt = this.publishedAt || new Date();
  }
  next();
});

module.exports = mongoose.model("Course", courseSchema);
