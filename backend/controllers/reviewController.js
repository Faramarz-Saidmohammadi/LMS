const mongoose = require("mongoose");
const Review = require("../models/Review");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

const createOrUpdateReview = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.userId;
    const { rating, comment = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating must be an integer between 1 and 5" });
    }

    const course = await Course.findOne({ _id: courseId, status: "published" }).select("_id instructorId title");
    if (!course) {
      return res.status(404).json({ message: "Course not found or not published" });
    }

    // ✅ فقط بعد از enroll
    const enrollment = await Enrollment.findOne({ studentId, courseId }).select("_id");
    if (!enrollment) {
      return res.status(400).json({ message: "You must enroll in this course before leaving a review" });
    }

    const cleanComment = String(comment || "").trim();

    // upsert: اگر قبلاً ریویو داده بود، آپدیت می‌کنیم
    const review = await Review.findOneAndUpdate(
      { courseId, studentId },
      { $set: { rating: r, comment: cleanComment } },
      { new: true, upsert: true }
    );

    return res.status(201).json({
      message: "Review saved",
      review,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      // rare race condition
      const review = await Review.findOne({ courseId: req.params.id, studentId: req.user.userId });
      return res.status(200).json({ message: "Review saved", review });
    }
    next(err);
  }
};

module.exports = { createOrUpdateReview };
