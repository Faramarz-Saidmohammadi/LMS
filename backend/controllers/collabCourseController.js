const Course = require("../models/Course");
const { validateCourseForSubmit } = require("../utils/courseValidator");

// GET /collab/courses (optional helper)
const getMyCourses = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const courses = await Course.find({ instructorId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
};

// POST /collab/courses/:id/submit
const submitCourseForReview = async (req, res, next) => {
  try {
    const collaboratorId = req.user.userId;
    const courseId = req.params.id;

    // ✅ validate course completeness
    const result = await validateCourseForSubmit({ courseId, instructorId: collaboratorId });

    if (!result.ok) {
      return res.status(400).json({
        message: "Course is not ready for submission",
        errors: result.errors,
        warnings: result.warnings,
      });
    }

    const course = await Course.findOne({ _id: courseId, instructorId: collaboratorId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // only draft/rejected can submit
    if (!["draft", "rejected"].includes(course.status)) {
      return res.status(400).json({ message: `Course cannot be submitted from status: ${course.status}` });
    }

    course.status = "under_review";
    course.submittedAt = new Date(); // اگر فیلد نداری، مشکلی نیست (mongoose ignore می‌کند اگر strict false نیست)
    await course.save();

    return res.status(200).json({
      message: "Course submitted for review",
      course: {
        id: course._id,
        status: course.status,
      },
      warnings: result.warnings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyCourses,
  submitCourseForReview,
};
