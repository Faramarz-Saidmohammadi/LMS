const mongoose = require("mongoose");
const Course = require("../models/Course");

module.exports = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;

    if (!courseId) return res.status(400).json({ message: "Missing courseId" });

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId).select("instructorId status");
    if (!course) return res.status(404).json({ message: "Course not found" });

    // admin اجازه دارد
    if ((req.user.roles || []).includes("admin")) {
      req.course = course;
      return next();
    }

    if (String(course.instructorId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Forbidden (not your course)" });
    }

    req.course = course;
    next();
  } catch (err) {
    next(err);
  }
};
