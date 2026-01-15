const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const getCollabDashboard = async (req, res, next) => {
  try {
    const collaboratorId = req.user.userId;

    // شمارش کورس‌ها بر اساس وضعیت برای همین کولابراتور
    const [
      totalPublishedCourses,
      totalDraftCourses,
      underReviewCourses,
      rejectedCourses,
      courseIds,
    ] = await Promise.all([
      Course.countDocuments({ instructorId: collaboratorId, status: "published" }),
      Course.countDocuments({ instructorId: collaboratorId, status: "draft" }),
      Course.countDocuments({ instructorId: collaboratorId, status: "under_review" }),
      Course.countDocuments({ instructorId: collaboratorId, status: "rejected" }),
      Course.find({ instructorId: collaboratorId }).select("_id").lean(),
    ]);

    const ids = (courseIds || []).map((c) => c._id);

    // تعداد کل ثبت‌نام‌ها در تمام کورس‌های همین کولابراتور
    // (اگر یک شاگرد در دو کورس ثبت‌نام کند، 2 حساب می‌شود — معمولاً برای داشبورد همین درست است)
    const totalStudentsEnrolled = ids.length
      ? await Enrollment.countDocuments({ courseId: { $in: ids } })
      : 0;

    // اگر خواستی یکتا هم داشته باشی (اختیاری)
    // const uniqueStudents = ids.length
    //   ? (await Enrollment.distinct("studentId", { courseId: { $in: ids } })).length
    //   : 0;

    return res.status(200).json({
      metrics: {
        totalPublishedCourses,
        totalDraftCourses,
        underReviewCourses,
        rejectedCourses,
        totalStudentsEnrolled,
        // uniqueStudents, // optional
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCollabDashboard };
