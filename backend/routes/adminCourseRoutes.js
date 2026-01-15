// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const {
//   getAdminCourses,
//   approveCourse,
//   rejectCourse,
//   publishCourse,
// } = require("../controllers/adminCourseController");

// // فقط admin
// router.get("/", auth, requireRoles(["admin"]), getAdminCourses);

// router.post("/:id/approve", auth, requireRoles(["admin"]), approveCourse);

// router.post("/:id/reject", auth, requireRoles(["admin"]), rejectCourse);

// router.post("/:id/publish", auth, requireRoles(["admin"]), publishCourse);

// module.exports = router;


/**
 * Admin Course Moderation Routes (مسیرهای بررسی و مدیریت کورس توسط ادمین) (Admin Course Controller Routes)
 * -----------------------------------------------------------------------------------------------
 * این فایل مخصوص ادمین است برای:
 *  1) گرفتن لیست کورس‌ها (با فیلتر status)
 *  2) تایید کورس (Approve)
 *  3) رد کورس با فیدبک (Reject + Feedback)
 *  4) نشر/پابلیش کورس (Publish)
 *
 * ✅ مهم برای فرانت/AI:
 * - تمام endpoint ها private هستند و فقط admin اجازه دارد.
 * - این API بعد از approve/reject/publish، برای instructor/collaborator نوتیفیکیشن می‌سازد.
 *
 * ------------------------------------------------------------------------------------------------
 * 🔐 Security / Access (امنیت و دسترسی)
 *
 * Middlewares:
 * 1) auth (JWT Authentication):
 *    - Token را از:
 *      a) Cookie: req.cookies.access_token
 *      b) Header: Authorization: Bearer <token>
 *    - اگر token نبود => 401 Unauthorized (token missing)
 *    - اگر JWT_SECRET نبود => 500 Server misconfig: JWT_SECRET missing
 *    - اگر token expired بود => 401 Unauthorized (token expired)
 *    - اگر token invalid بود => 401 Unauthorized (invalid token)
 *    - اگر موفق => req.user = { userId, roles }
 *
 * 2) requireRoles(["admin"]) (RBAC):
 *    - فقط نقش admin اجازه دارد
 *    - اگر نقش کافی نبود => 403 Forbidden (insufficient role)
 *      { message: "Forbidden (insufficient role)", required: ["admin"] }
 *
 * ------------------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر این مسیر mount می‌شود:
 *   app.use("/admin/courses", router)
 *
 * پس endpoint ها می‌شود:
 *   GET  /admin/courses?status=
 *   POST /admin/courses/:id/approve
 *   POST /admin/courses/:id/reject
 *   POST /admin/courses/:id/publish
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const {
  getAdminCourses,
  approveCourse,
  rejectCourse,
  publishCourse,
} = require("../controllers/adminCourseController");

/**
 * ------------------------------------------------------------------------------------------------
 * ✅ 1) Get Admin Courses (لیست کورس‌ها برای ادمین) (Get Courses for Admin)
 * ------------------------------------------------------------------------------------------------
 * @method   GET
 * @route    /
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @query params (اختیاری)
 * - status: string
 *   وضعیت کورس‌ها را فیلتر می‌کند.
 *   طبق controller، status های رایج:
 *   - draft
 *   - under_review
 *   - rejected
 *   - approved
 *   - published
 *
 * @example
 * - GET /admin/courses
 * - GET /admin/courses?status=under_review
 *
 * @response 200
 * {
 *   "courses": [
 *     {
 *       "_id": "...",
 *       "title": "...",
 *       "status": "...",
 *       "category": { "_id": "...", "name": "...", "slug": "..." },
 *       "instructorId": { "_id": "...", "name": "...", "email": "...", "roles": [...], "avatar": "..." },
 *       "updatedAt": "...",
 *       ...
 *     }
 *   ]
 * }
 *
 * @common errors
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.get("/", auth, requireRoles(["admin"]), getAdminCourses);

/**
 * ------------------------------------------------------------------------------------------------
 * ✅ 2) Approve Course (تایید کورس) (Approve Course)
 * ------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /:id/approve
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - id: CourseId (MongoId)
 *
 * @rules (قواعد)
 * - id باید ObjectId معتبر باشد، وگرنه:
 *   400 { message: "Invalid course id" }
 * - کورس باید وجود داشته باشد:
 *   404 { message: "Course not found" }
 * - فقط کورس‌هایی که status شان "under_review" است قابل approve هستند:
 *   400 { message: "Only under_review courses can be approved" }
 *
 * @side effects (کارهای جانبی)
 * - status کورس => "approved"
 * - course.needsReReview = false
 * - course.isLocked = false
 * - ایجاد نوتیفیکیشن برای instructor/collaborator:
 *   type: "course_approved"
 *   payload: { courseId }
 *
 * @response 200
 * {
 *   "message": "Course approved",
 *   "course": { "id": "...", "status": "approved" }
 * }
 *
 * @common errors
 * - 401 / 403
 * - 400 / 404 طبق بالا
 */
router.post("/:id/approve", auth, requireRoles(["admin"]), approveCourse);

/**
 * ------------------------------------------------------------------------------------------------
 * ✅ 3) Reject Course (رد کورس با فیدبک) (Reject Course + Feedback)
 * ------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /:id/reject
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - id: CourseId (MongoId)
 *
 * @body (ضروری)
 * - feedbackText: string (required)
 *
 * @rules (قواعد)
 * - id باید معتبر باشد:
 *   400 { message: "Invalid course id" }
 * - feedbackText باید خالی نباشد:
 *   400 { message: "feedbackText is required" }
 * - کورس باید وجود داشته باشد:
 *   404 { message: "Course not found" }
 * - فقط "under_review" قابل reject است:
 *   400 { message: "Only under_review courses can be rejected" }
 *
 * @side effects (کارهای جانبی)
 * - feedbackText در course.feedback push می‌شود:
 *   { message: text, by: req.user.userId, at: new Date() }
 * - status کورس => "rejected"
 * - needsReReview = false
 * - isLocked = false
 * - ایجاد نوتیفیکیشن برای instructor:
 *   type: "course_rejected"
 *   payload: { courseId, feedbackText }
 *
 * @example
 * POST /admin/courses/65f.../reject
 * body:
 *   { "feedbackText": "تصاویر ناقص است، لطفاً دوباره آپلود کن." }
 *
 * @response 200
 * {
 *   "message": "Course rejected with feedback",
 *   "course": { "id": "...", "status": "rejected" }
 * }
 *
 * @common errors
 * - 401 / 403
 * - 400 / 404 طبق بالا
 */
router.post("/:id/reject", auth, requireRoles(["admin"]), rejectCourse);

/**
 * ------------------------------------------------------------------------------------------------
 * ✅ 4) Publish Course (نشر/پابلیش کورس) (Publish Course)
 * ------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /:id/publish
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - id: CourseId (MongoId)
 *
 * @rules (قواعد)
 * - id باید معتبر باشد:
 *   400 { message: "Invalid course id" }
 * - کورس باید وجود داشته باشد:
 *   404 { message: "Course not found" }
 * - فقط کورس‌هایی که status شان "approved" است قابل publish هستند:
 *   400 { message: "Only approved courses can be published" }
 *
 * @side effects (کارهای جانبی)
 * - course.status = "published"
 * - course.needsReReview = false
 * - ایجاد نوتیفیکیشن برای instructor:
 *   type: "course_published"
 *   payload: { courseId }
 *
 * ⚠️ نکته فنی
 * - controller در select فیلد publishedAt را می‌گیرد ولی خودش set نمی‌کند.
 *   یعنی اگر در مدل Course یک hook یا default برای publishedAt دارید، آن انجام می‌شود.
 *   اگر ندارید، publishedAt ممکن است null بماند.
 *
 * @response 200
 * {
 *   "message": "Course published",
 *   "course": {
 *     "id": "...",
 *     "status": "published",
 *     "isLocked": false,
 *     "publishedAt": "..."
 *   }
 * }
 *
 * @common errors
 * - 401 / 403
 * - 400 / 404 طبق بالا
 */
router.post("/:id/publish", auth, requireRoles(["admin"]), publishCourse);

module.exports = router;
