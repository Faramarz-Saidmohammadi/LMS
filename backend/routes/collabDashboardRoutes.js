// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const { getCollabDashboard } = require("../controllers/collabDashboardController");

// // GET /collab/dashboard
// router.get("/dashboard", auth, requireRoles(["collaborator", "admin"]), getCollabDashboard);

// module.exports = router;
/**
 * Collaborator Dashboard Routes (مسیر داشبورد کولابراتور) (Collab Dashboard Routes)
 * -------------------------------------------------------------------------------------------------
 * این فایل فقط یک endpoint دارد که آمار/متریک‌های داشبورد کولابراتور را برمی‌گرداند.
 *
 * ✅ خروجی این داشبورد شامل:
 * - تعداد کورس‌های منتشرشده (published)
 * - تعداد کورس‌های پیش‌نویس (draft)
 * - تعداد کورس‌های تحت بررسی (under_review)
 * - تعداد کورس‌های ردشده (rejected)
 * - تعداد کل ثبت‌نام‌ها (Enrollments) روی تمام کورس‌های همین کولابراتور
 *
 * -------------------------------------------------------------------------------------------------
 * 🔐 Security / Access (امنیت و دسترسی)
 * - auth (JWT) لازم است
 * - requireRoles(["collaborator","admin"]) لازم است
 *
 * ⚠️ نکته مهم:
 * - controller با collaboratorId = req.user.userId کار می‌کند.
 * - یعنی حتی اگر admin هم بزند، متریک‌ها مربوط به کورس‌های همان user لاگین‌شده است،
 *   نه متریک‌های همه کولابراتورها.
 *
 * -------------------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر مسیر زیر mount می‌شود:
 *   app.use("/collab", router)
 *
 * پس endpoint نهایی:
 *   GET /collab/dashboard
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const { getCollabDashboard } = require("../controllers/collabDashboardController");

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ Get Collaborator Dashboard Metrics (گرفتن متریک‌های داشبورد) (Get Dashboard Metrics)
 * -------------------------------------------------------------------------------------------------
 * @method   GET
 * @route    /dashboard
 * @access   Private (collaborator|admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["collaborator","admin"])
 *
 * @query
 * - هیچ query لازم نیست
 *
 * @behavior (منطق controller)
 * - collaboratorId از JWT گرفته می‌شود: req.user.userId
 * - سپس 5 کار موازی انجام می‌دهد (Promise.all):
 *   1) count کورس‌های published
 *   2) count کورس‌های draft
 *   3) count کورس‌های under_review
 *   4) count کورس‌های rejected
 *   5) گرفتن لیست تمام courseIds همین instructor (فقط _id)
 *
 * - بعد ids را استخراج می‌کند
 * - سپس totalStudentsEnrolled را می‌گیرد:
 *   Enrollment.countDocuments({ courseId: { $in: ids } })
 *
 * ✅ مفهوم totalStudentsEnrolled:
 * - "تعداد کل ثبت‌نام‌ها" است، نه تعداد شاگرد یکتا.
 * - اگر یک شاگرد در دو کورس ثبت‌نام کند، 2 حساب می‌شود (برای داشبورد معمولاً همین خوب است)
 * - اگر روزی تعداد یکتا خواستی، از distinct("studentId") می‌شود گرفت (تو کد کامنت شده)
 *
 * @success 200
 * {
 *   "metrics": {
 *     "totalPublishedCourses": 3,
 *     "totalDraftCourses": 2,
 *     "underReviewCourses": 1,
 *     "rejectedCourses": 0,
 *     "totalStudentsEnrolled": 57
 *   }
 * }
 *
 * @errors
 * - 401 Unauthorized (token missing/expired/invalid)
 * - 403 Forbidden (insufficient role)
 * - 500 (Server error) => next(err)
 *
 * @front-end usage idea (ایده مصرف در فرانت)
 * - این endpoint را هنگام load صفحه داشبورد صدا بزن
 * - metrics را داخل کارت‌های dashboard نمایش بده
 * - اگر 401 شد => redirect به login
 * - اگر 403 شد => پیام عدم دسترسی
 */
router.get("/dashboard", auth, requireRoles(["collaborator", "admin"]), getCollabDashboard);

module.exports = router;
