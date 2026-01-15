const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const CurriculumItem = require("../models/CurriculumItem");

// محاسبه درصد پیشرفت بر اساس approved items فقط
const calculateProgress = async ({ courseId, completedItems }) => {
  const totalApproved = await CurriculumItem.countDocuments({
    courseId,
    status: "approved",
  });

  if (totalApproved === 0) {
    // اگر هیچ آیتم approved نیست، پیشرفت 0
    return { percent: 0, totalApproved: 0, completedApproved: 0 };
  }

  const completedApproved = await CurriculumItem.countDocuments({
    courseId,
    status: "approved",
    _id: { $in: completedItems || [] },
  });

  const percent = Math.round((completedApproved / totalApproved) * 10000) / 100; // 2 decimal
  return { percent, totalApproved, completedApproved };
};

// ------------------------------------
// POST /courses/:id/enroll
// ------------------------------------
const enrollCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    // فقط کورس published قابل enroll است
    const course = await Course.findOne({ _id: courseId, status: "published" }).select(
      "_id title status publishedAt"
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found or not published" });
    }

    // اگر قبلاً enroll شده
    const existing = await Enrollment.findOne({ studentId, courseId });
    if (existing) {
      return res.status(200).json({
        message: "Already enrolled",
        enrollment: existing,
      });
    }

    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      progressPercent: 0,
      completedItems: [],
      lastAccessed: new Date(),
      isCompleted: false,
      completedAt: null,
    });

    return res.status(201).json({
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (err) {
    // اگر unique constraint برخورد کرد
    if (err && err.code === 11000) {
      const enrollment = await Enrollment.findOne({
        studentId: req.user.userId,
        courseId: req.params.id,
      });
      return res.status(200).json({ message: "Already enrolled", enrollment });
    }
    next(err);
  }
};

// ------------------------------------
// GET /me/enrollments
// ------------------------------------
const getMyEnrollments = async (req, res, next) => {
  try {
    const studentId = req.user.userId;

    const enrollments = await Enrollment.find({ studentId })
      .populate({
        path: "courseId",
        select: "title shortDesc status publishedAt",
        populate: { path: "category", select: "name slug" },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({ enrollments });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------
// POST /courses/:id/progress/complete-item
// body: { itemId }
// ------------------------------------
const completeCourseItem = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.userId;
    const { itemId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    // باید enroll موجود باشد
    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) {
      return res.status(400).json({ message: "You are not enrolled in this course" });
    }

    // آیتم باید مربوط همین کورس و approved باشد (چون شاگرد فقط approved می‌بیند)
    const item = await CurriculumItem.findOne({
      _id: itemId,
      courseId,
      status: "approved",
    }).select("_id type status");

    if (!item) {
      return res.status(404).json({ message: "Item not found or not approved for students" });
    }

    // اگر قبلاً complete شده بود
    const alreadyDone = enrollment.completedItems.some((x) => String(x) === String(itemId));

    if (!alreadyDone) {
      enrollment.completedItems.push(itemId);
    }

    enrollment.lastAccessed = new Date();

    // محاسبه درصد جدید
    const { percent, totalApproved, completedApproved } = await calculateProgress({
      courseId,
      completedItems: enrollment.completedItems,
    });

    enrollment.progressPercent = percent;

    // اگر کامل شد
    if (totalApproved > 0 && completedApproved >= totalApproved) {
      enrollment.progressPercent = 100;
      enrollment.isCompleted = true;
      enrollment.completedAt = enrollment.completedAt || new Date();
    } else {
      enrollment.isCompleted = false;
      enrollment.completedAt = null;
    }

    await enrollment.save();

    return res.status(200).json({
      message: "Progress updated",
      progress: {
        courseId,
        progressPercent: enrollment.progressPercent,
        totalApprovedItems: totalApproved,
        completedApprovedItems: completedApproved,
        isCompleted: enrollment.isCompleted,
        completedAt: enrollment.completedAt,
        lastAccessed: enrollment.lastAccessed,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  enrollCourse,
  getMyEnrollments,
  completeCourseItem,
};
