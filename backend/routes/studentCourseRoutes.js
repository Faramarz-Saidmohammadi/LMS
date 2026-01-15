// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");
// const { listStudentCourses } = require("../controllers/studentCourseCatalogController");
// const {
//   getPublishedCoursesForStudent,
//   getPublishedCourseDetailForStudent,
// } = require("../controllers/studentCourseController");

// // فقط student (یا admin)
// router.get("/", auth, requireRoles(["student", "admin"]), getPublishedCoursesForStudent);
// router.get("/:id", auth, requireRoles(["student", "admin"]), getPublishedCourseDetailForStudent);

// module.exports = router;




const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const {
  getPublishedCoursesForStudent,
  getPublishedCourseDetailForStudent,
} = require("../controllers/studentCourseController");

/**
 * =============================================================================
 * Student Courses (Protected) — مسیرهای شاگرد برای دیدن کورس‌ها و جزئیات (Student View)
 * =============================================================================
 *
 * ✅ این Router برای قسمت "داخل سیستم" شاگرد است (Protected).
 * یعنی شاگرد باید لاگین باشد تا لیست و جزئیات کورس‌ها را ببیند.
 *
 * AUTH:
 * - Required ✅ auth
 *   - token از Cookie (access_token) یا Authorization Bearer خوانده می‌شود
 *   - req.user = { userId, roles }
 *
 * ROLES:
 * - student | admin
 *
 * BASE PATH (مهم برای فرانت):
 * - پیشنهاد Mount:
 *   app.use("/student/courses", studentCoursesRoutes)
 *
 * پس مسیرهای نهایی:
 * - GET  /student/courses
 * - GET  /student/courses/:id
 *
 * IMPORTANT BUSINESS RULES (طبق controller):
 * - فقط کورس‌های status="published"
 * - جزئیات کورس: فقط آیتم‌های status="approved" ارسال می‌شود
 * - برای Quiz: جواب‌های درست (correctAnswerIndexes) برای شاگرد حذف می‌شود ✅
 *
 * FRONTEND NOTES:
 * - Cookie Auth: fetch credentials: "include" / axios withCredentials: true
 * =============================================================================
 */

/**
 * -----------------------------------------------------------------------------
 * 1) LIST PUBLISHED COURSES (Student/Admin)
 * -----------------------------------------------------------------------------
 * GET /student/courses
 *
 * PURPOSE:
 * - لیست تمام کورس‌های Published را برای شاگرد/ادمین برمی‌گرداند
 *
 * AUTH:
 * - Required ✅ auth
 *
 * ROLES:
 * - student | admin
 *
 * QUERY:
 * - ندارد (این endpoint ساده است و pagination/search ندارد)
 *
 * RESPONSE 200:
 * {
 *   "courses": [
 *      {
 *        _id, title, shortDesc, ...,
 *        category: { name, slug },
 *        instructorId: { name, avatar }
 *      }
 *   ]
 * }
 *
 * COMMON ERRORS:
 * - 401 Unauthorized (token missing/invalid/expired)
 * - 403 Forbidden (role not allowed)
 */
router.get("/", auth, requireRoles(["student", "admin"]), getPublishedCoursesForStudent);

/**
 * -----------------------------------------------------------------------------
 * 2) COURSE DETAIL FOR STUDENT (Published + Approved Curriculum Only)
 * -----------------------------------------------------------------------------
 * GET /student/courses/:id
 *
 * PURPOSE:
 * - جزئیات یک کورس Published را می‌دهد
 * - curriculum:
 *   - فقط sectionهایی که حداقل 1 آیتم approved دارند
 *   - فقط آیتم‌های approved
 *   - اگر quiz باشد correctAnswerIndexes حذف می‌شود (برای جلوگیری از لو رفتن جواب)
 *
 * AUTH:
 * - Required ✅ auth
 *
 * ROLES:
 * - student | admin
 *
 * PARAMS:
 * - id: courseId (Mongo ObjectId)
 *
 * RESPONSE 200:
 * {
 *   "course": {...},
 *   "sections": [...],   // only sections with approved items
 *   "items": [...]       // only approved items (sanitized quizzes)
 * }
 *
 * COMMON ERRORS:
 * - 400 Invalid course id
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 404 Course not found or not published
 */
router.get("/:id", auth, requireRoles(["student", "admin"]), getPublishedCourseDetailForStudent);

module.exports = router;
