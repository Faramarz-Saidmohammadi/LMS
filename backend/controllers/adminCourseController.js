const mongoose = require("mongoose");
const Course = require("../models/Course");
const { createNotification } = require("../utils/notify");

const getAdminCourses = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const courses = await Course.find(filter)
      .populate("category", "name slug")
      .populate("instructorId", "name email roles avatar")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
};

const approveCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id).select("status instructorId title");
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "under_review") {
      return res.status(400).json({ message: "Only under_review courses can be approved" });
    }

    course.status = "approved";
    course.needsReReview = false;
    course.isLocked = false;

    await course.save();

    // ✅ notify collaborator
    await createNotification({
      userId: course.instructorId,
      type: "course_approved",
      title: "Course Approved",
      message: `Your course "${course.title}" has been approved.`,
      payload: { courseId: course._id },
    });

    return res.status(200).json({
      message: "Course approved",
      course: { id: course._id, status: course.status },
    });
  } catch (err) {
    next(err);
  }
};

const rejectCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedbackText } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const text = String(feedbackText || "").trim();
    if (!text) {
      return res.status(400).json({ message: "feedbackText is required" });
    }

    const course = await Course.findById(id).select("status instructorId title feedback");
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "under_review") {
      return res.status(400).json({ message: "Only under_review courses can be rejected" });
    }

    course.feedback.push({
      message: text,
      by: req.user.userId,
      at: new Date(),
    });

    course.status = "rejected";
    course.needsReReview = false;
    course.isLocked = false;

    await course.save();

    // ✅ notify collaborator
    await createNotification({
      userId: course.instructorId,
      type: "course_rejected",
      title: "Course Rejected",
      message: `Your course "${course.title}" was rejected: ${text}`,
      payload: { courseId: course._id, feedbackText: text },
    });

    return res.status(200).json({
      message: "Course rejected with feedback",
      course: { id: course._id, status: course.status },
    });
  } catch (err) {
    next(err);
  }
};

// POST /admin/courses/:id/publish
const publishCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id).select("status instructorId title isLocked publishedAt");
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "approved") {
      return res.status(400).json({ message: "Only approved courses can be published" });
    }

    course.status = "published";
    course.needsReReview = false;

    await course.save();

    // ✅ notify collaborator
    await createNotification({
      userId: course.instructorId,
      type: "course_published",
      title: "Course Published",
      message: `Your course "${course.title}" has been published.`,
      payload: { courseId: course._id },
    });

    return res.status(200).json({
      message: "Course published",
      course: {
        id: course._id,
        status: course.status,
        isLocked: course.isLocked,
        publishedAt: course.publishedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminCourses,
  approveCourse,
  rejectCourse,
  publishCourse,
};
