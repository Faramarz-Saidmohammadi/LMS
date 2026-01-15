const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseSection = require("../models/CourseSection");
const CurriculumItem = require("../models/CurriculumItem");

// quiz: correct answers را برای student نفرست
const sanitizeItemForStudent = (item) => {
  const obj = item.toObject ? item.toObject() : item;

  if (obj.type === "quiz" && obj.content?.quiz?.questions) {
    obj.content.quiz.questions = obj.content.quiz.questions.map((q) => {
      const { correctAnswerIndexes, ...rest } = q;
      return rest;
    });
  }

  return obj;
};

// GET /student/courses => فقط published
const getPublishedCoursesForStudent = async (req, res, next) => {
  try {
    const courses = await Course.find({ status: "published" })
      .populate("category", "name slug")
      .populate("instructorId", "name avatar")
      .sort({ publishedAt: -1 });

    return res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
};

// GET /student/courses/:id => published + sections that have approved items + approved items only
const getPublishedCourseDetailForStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findOne({ _id: id, status: "published" })
      .populate("category", "name slug")
      .populate("instructorId", "name avatar");

    if (!course) return res.status(404).json({ message: "Course not found or not published" });

    // ✅ فقط approved items
    const items = await CurriculumItem.find({ courseId: id, status: "approved" })
      .sort({ sectionId: 1, order: 1, createdAt: 1 });

    const safeItems = items.map(sanitizeItemForStudent);

    // ✅ فقط sectionهایی که حداقل یک approved item دارند
    const approvedSectionIds = Array.from(
      new Set(safeItems.map((it) => String(it.sectionId)))
    );

    const sections = await CourseSection.find({ courseId: id, _id: { $in: approvedSectionIds } })
      .sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      course,
      sections,
      items: safeItems,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublishedCoursesForStudent,
  getPublishedCourseDetailForStudent,
};
