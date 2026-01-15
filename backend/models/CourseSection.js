const mongoose = require("mongoose");

const courseSectionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseSection", courseSectionSchema);
