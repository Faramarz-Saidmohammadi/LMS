const mongoose = require("mongoose");
const Course = require("../models/Course");
const Category = require("../models/Category");
const CourseSection = require("../models/CourseSection");
const CurriculumItem = require("../models/CurriculumItem");

// helper: فقط همین فیلدها قابل ادیت توسط collaborator
const allowedUpdateFields = ["title", "shortDesc", "startDate", "duration", "category"];

const createCourse = async (req, res, next) => {
  try {
    const { title, shortDesc, startDate, duration, category } = req.body;

    if (!title || !shortDesc || !category) {
      return res.status(400).json({ message: "title, shortDesc, category are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const cat = await Category.findById(category);
    if (!cat || !cat.isActive) {
      return res.status(400).json({ message: "Category not found or inactive" });
    }

    const course = new Course({
      title: String(title).trim(),
      shortDesc: String(shortDesc).trim(),
      startDate: startDate ? new Date(startDate) : null,
      duration: String(duration || "").trim(),
      category,
      instructorId: req.user.userId,
      status: "draft",
    });
    await course.save();

    return res.status(201).json({
      message: "Course created (draft)",
      course,
    });
  } catch (err) {
    next(err);
  }
};

const getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructorId: req.user.userId })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
};

const getMyCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user.userId,
    }).populate("category", "name slug");

    if (!course) return res.status(404).json({ message: "Course not found" });

    return res.status(200).json({ course });
  } catch (err) {
    next(err);
  }
};

// Update rules (مثل مرحله ۹)
const updateMyCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user.userId,
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // تحت بررسی: ادیت ممنوع
    if (course.status === "under_review") {
      return res.status(400).json({ message: "Course is under review. You cannot edit now." });
    }

    const updates = {};
    for (const key of allowedUpdateFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.category) {
      if (!mongoose.Types.ObjectId.isValid(updates.category)) {
        return res.status(400).json({ message: "Invalid category id" });
      }
      const cat = await Category.findById(updates.category);
      if (!cat || !cat.isActive) {
        return res.status(400).json({ message: "Category not found or inactive" });
      }
    }

    const isSensitiveStatus = course.status === "published" || course.status === "approved";

    Object.assign(course, {
      ...updates,
      startDate: updates.startDate ? new Date(updates.startDate) : course.startDate,
      duration: updates.duration !== undefined ? String(updates.duration || "").trim() : course.duration,
    });

    if (isSensitiveStatus) {
      course.needsReReview = true;
      course.status = "draft";
      course.isLocked = false;
      course.lockedFields = Object.keys(updates);
    }

    await course.save();

    return res.status(200).json({
      message: isSensitiveStatus
        ? "Course updated. It is now draft and requires re-review."
        : "Course updated",
      course,
    });
  } catch (err) {
    next(err);
  }
};

const deleteMyCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user.userId,
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status === "published") {
      return res.status(400).json({ message: "Published course cannot be deleted" });
    }

    if (course.status === "under_review") {
      return res.status(400).json({ message: "Course under review cannot be deleted" });
    }

    await Course.deleteOne({ _id: course._id });

    return res.status(200).json({ message: "Course deleted" });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------
// ✅ Stage 14: Submit course for review
// POST /collab/courses/:courseId/submit
// --------------------------------------------
const submitCourseForReview = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId).select(
      "title shortDesc startDate duration category instructorId status needsReReview isLocked"
    );

    if (!course) return res.status(404).json({ message: "Course not found" });

    // فقط owner (collaborator) یا admin
    const isAdmin = (req.user.roles || []).includes("admin");
    if (!isAdmin && String(course.instructorId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Forbidden (not your course)" });
    }

    // وضعیت‌های غیرمجاز
    if (course.status === "published") {
      return res.status(400).json({ message: "Published course cannot be submitted for review" });
    }
    if (course.status === "under_review") {
      return res.status(400).json({ message: "Course is already under review" });
    }

    // فقط draft یا rejected اجازه submit دارد
    if (!["draft", "rejected"].includes(course.status)) {
      return res.status(400).json({ message: `Course cannot be submitted from status: ${course.status}` });
    }

    // ✅ Check Details (Step 1)
    const missing = [];

    if (!String(course.title || "").trim()) missing.push("title");
    if (!String(course.shortDesc || "").trim()) missing.push("shortDesc");
    if (!course.startDate) missing.push("startDate");
    if (!String(course.duration || "").trim()) missing.push("duration");
    if (!course.category) missing.push("category");

    if (missing.length) {
      return res.status(400).json({
        message: "Course details are incomplete",
        missing,
      });
    }

    // ✅ Check Curriculum (Step 2) + min items
    const sections = await CourseSection.find({ courseId }).select("_id title order").sort({ order: 1, createdAt: 1 });
    if (!sections.length) {
      return res.status(400).json({ message: "Curriculum is incomplete: at least 1 section is required" });
    }

    const items = await CurriculumItem.find({ courseId }).select("type sectionId status title content");
    if (!items.length) {
      return res.status(400).json({ message: "Curriculum is incomplete: at least 1 item is required" });
    }

    // هر سکشن حداقل ۱ آیتم داشته باشد
    const sectionIds = new Set(sections.map((s) => String(s._id)));
    const itemsBySection = new Map(); // sectionId -> count
    for (const it of items) {
      const sid = String(it.sectionId);
      if (!itemsBySection.has(sid)) itemsBySection.set(sid, 0);
      itemsBySection.set(sid, itemsBySection.get(sid) + 1);
    }

    const emptySections = [];
    for (const sid of sectionIds) {
      if (!itemsBySection.get(sid)) emptySections.push(sid);
    }

    if (emptySections.length) {
      return res.status(400).json({
        message: "Curriculum is incomplete: each section must have at least 1 item",
        emptySections,
      });
    }

    // ✅ Validate each item has minimum required content (quality gate)
    const invalidItems = [];

    for (const it of items) {
      const c = it.content || {};

      if (it.type === "article") {
        const hasHtml = String(c.articleHtml || "").trim().length > 0;
        const hasJson = c.articleJson !== undefined && c.articleJson !== null;
        if (!hasHtml && !hasJson) {
          invalidItems.push({ itemId: it._id, reason: "Article content is empty" });
        }
      }

      if (it.type === "video") {
        const vid = String(c.youtubeVideoId || "").trim();
        const unlisted = Boolean(c.isUnlistedDeclared);
        if (!vid || vid.length !== 11 || !unlisted) {
          invalidItems.push({ itemId: it._id, reason: "Video fields invalid (youtubeVideoId / isUnlistedDeclared)" });
        }
        const mins = Number(c.videoLengthMinutes || 0);
        if (!Number.isNaN(mins) && mins > 15) {
          invalidItems.push({ itemId: it._id, reason: "Video length declared > 15 minutes" });
        }
      }

      if (it.type === "quiz") {
        const qs = c.quiz?.questions;
        if (!Array.isArray(qs) || qs.length === 0) {
          invalidItems.push({ itemId: it._id, reason: "Quiz has no questions" });
        }
      }

      if (it.type === "attachment") {
        const url = String(c.attachmentUrl || "").trim();
        if (!url) {
          invalidItems.push({ itemId: it._id, reason: "Attachment url is empty" });
        }
      }
    }

    if (invalidItems.length) {
      return res.status(400).json({
        message: "Curriculum items are incomplete/invalid",
        invalidItems,
      });
    }

    // ✅ Passed all checks → move to under_review
    course.status = "under_review";
    course.needsReReview = false;
    course.isLocked = false; // هنوز قفل نیست
    await course.save();

    return res.status(200).json({
      message: "Course submitted for review",
      course: {
        id: course._id,
        status: course.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCourse,
  getMyCourses,
  getMyCourseById,
  updateMyCourse,
  deleteMyCourse,

  // stage 14
  submitCourseForReview,
};
