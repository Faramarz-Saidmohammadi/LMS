// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const { uploadAttachment, uploadCertificate } = require("../controllers/uploadController");
// const { uploadAttachmentMulter, uploadCertificateMulter } = require("../middleware/uploadMulter");

// /**
//  * POST /uploads/attachment
//  * - field name: file
//  * - roles: collaborator/admin
//  */
// router.post(
//   "/attachment",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   uploadAttachmentMulter.single("file"),
//   uploadAttachment
// );

// /**
//  * POST /uploads/certificate
//  * - field name: file
//  * - roles: admin (چون معمولاً certificate را سیستم/admin می‌سازد)
//  * اگر خواستی student هم بتواند، roles را تغییر می‌دهیم.
//  */
// router.post(
//   "/certificate",
//   auth,
//   requireRoles(["admin"]),
//   uploadCertificateMulter.single("file"),
//   uploadCertificate
// );

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
 * Student Courses (Protected) — کورس‌های شاگرد (محافظت‌شده)
 * =============================================================================
 *
 * این Router برای بخش داخل سیستم شاگرد است.
 * یعنی کاربر باید لاگین باشد و نقش (role) مناسب داشته باشد.
 *
 * MIDDLEWARES (وابستگی‌ها و نقش‌شان):
 * 1) auth (احراز هویت):
 *    - token را از Cookie: access_token یا Header: Authorization Bearer می‌گیرد
 *    - اگر معتبر بود، req.user را ست می‌کند:
 *      req.user = { userId: "...", roles: ["student","admin", ...] }
 *    - خطاهای رایج:
 *      401 token missing / invalid / expired
 *
 * 2) requireRoles (اجازه دسترسی بر اساس نقش):
 *    - فقط اگر req.user.roles یکی از نقش‌های allowed باشد، اجازه می‌دهد
 *    - خطای رایج: 403 Forbidden (insufficient role)
 *
 * پیشنهادی برای Mount (نقطه اتصال در app.js):
 *   app.use("/student/courses", require("./routes/studentCoursesRoutes"));
 *
 * پس مسیرهای نهایی (Final Endpoints):
 *   GET  /student/courses
 *   GET  /student/courses/:id
 *
 * BUSINESS RULES (طبق controller):
 * - فقط کورس‌های status="published" به شاگرد نشان داده می‌شود
 * - جزئیات کورس:
 *   - فقط sectionهایی که حداقل یک item approved دارند
 *   - فقط itemهای approved
 *   - quizها برای شاگرد sanitize می‌شود: correctAnswerIndexes حذف می‌گردد
 *
 * FRONTEND NOTES:
 * - اگر token در Cookie باشد:
 *   - fetch: { credentials: "include" }
 *   - axios: { withCredentials: true }
 * =============================================================================
 */

/**
 * -----------------------------------------------------------------------------
 * GET /student/courses
 * -----------------------------------------------------------------------------
 * PURPOSE:
 * - لیست کورس‌های Published را برای student/admin می‌دهد
 *
 * AUTH:
 * - لازم: ✅
 * ROLES:
 * - student | admin
 *
 * QUERY:
 * - ندارد (بدون pagination/search)
 *
 * RESPONSE 200:
 * {
 *   "courses": [ ... ]
 * }
 *
 * ERRORS:
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.get("/", auth, requireRoles(["student", "admin"]), getPublishedCoursesForStudent);

/**
 * -----------------------------------------------------------------------------
 * GET /student/courses/:id
 * -----------------------------------------------------------------------------
 * PURPOSE:
 * - جزئیات یک کورس Published را می‌دهد + curriculum فیلتر شده
 *
 * AUTH:
 * - لازم: ✅
 * ROLES:
 * - student | admin
 *
 * PARAMS:
 * - id: CourseId (Mongo ObjectId)
 *
 * RESPONSE 200:
 * {
 *   "course": {...},
 *   "sections": [...],   // فقط سکشن‌هایی که approved item دارند
 *   "items": [...]       // فقط approved items (quiz sanitized)
 * }
 *
 * ERRORS:
 * - 400 Invalid course id
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 404 Course not found or not published
 */
router.get("/:id", auth, requireRoles(["student", "admin"]), getPublishedCourseDetailForStudent);

module.exports = router;
