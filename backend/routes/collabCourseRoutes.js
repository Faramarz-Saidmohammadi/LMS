// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const { getMyCourses, submitCourseForReview } = require("../controllers/collabCourseController");

// // list my courses
// router.get("/", auth, requireRoles(["collaborator", "admin"]), getMyCourses);

// // submit for review
// router.post("/:id/submit", auth, requireRoles(["collaborator", "admin"]), submitCourseForReview);

// module.exports = router;
/**
 * Collaborator Courses Routes (مسیرهای کورس‌های کولابراتور) (Collab Courses Routes)
 * -------------------------------------------------------------------------------------------------
 * این فایل مخصوص collaborator است برای:
 * 1) دیدن لیست کورس‌های خودش (My Courses)
 * 2) فرستادن یک کورس برای بررسی ادمین (Submit for Review)
 *
 * ✅ Endpoint های این فایل:
 * - GET  /collab/courses
 * - POST /collab/courses/:id/submit
 *
 * -------------------------------------------------------------------------------------------------
 * 🔐 Security / Access (امنیت و دسترسی)
 * هر دو مسیر Protected هستند:
 * - auth (JWT) لازم است
 * - requireRoles(["collaborator","admin"]) لازم است
 *
 * ⚠️ نکته مهم (مثل قبل)
 * - controller ها با instructorId = req.user.userId کار می‌کنند
 * - یعنی اگر admin این endpoint را بزند ولی صاحب کورس نباشد، 404 می‌گیرد.
 *   پس در عمل این مسیر برای collaborator ساخته شده.
 *
 * -------------------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر مسیر زیر mount می‌شود:
 *   app.use("/collab/courses", router)
 *
 * پس داخل همین فایل:
 *   GET  /        => GET /collab/courses
 *   POST /:id/submit => POST /collab/courses/:id/submit
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const { getMyCourses, submitCourseForReview } = require("../controllers/collabCourseController");

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 1) List My Courses (لیست کورس‌های خودم) (Get My Courses)
 * -------------------------------------------------------------------------------------------------
 * @method   GET
 * @route    /
 * @access   Private (collaborator|admin) (ولی عملاً کورس‌های user لاگین)
 * @middlewares
 *   - auth
 *   - requireRoles(["collaborator","admin"])
 *
 * @behavior
 * - userId = req.user.userId
 * - courses = Course.find({ instructorId: userId })
 * - sort({ createdAt: -1 }) => جدیدترین کورس‌ها اول
 * - lean() => خروجی سبک‌تر/سریع‌تر
 *
 * @success 200
 * {
 *   "courses": [
 *     {
 *       "_id": "...",
 *       "title": "...",
 *       "status": "draft|under_review|rejected|approved|published",
 *       "instructorId": "...",
 *       ...
 *     }
 *   ]
 * }
 *
 * @errors
 * - 401 Unauthorized (token missing/expired/invalid)
 * - 403 Forbidden (insufficient role)
 */
router.get("/", auth, requireRoles(["collaborator", "admin"]), getMyCourses);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 2) Submit Course For Review (ارسال کورس برای بررسی) (Submit Course)
 * -------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /:id/submit
 * @access   Private (collaborator|admin) (ولی عملاً فقط صاحب کورس)
 * @middlewares
 *   - auth
 *   - requireRoles(["collaborator","admin"])
 *
 * @params
 * - id: courseId (MongoId string)
 *
 * @body
 * - هیچ چیزی لازم نیست
 *
 * -----------------------------------------------------------------------------------------------
 * @behavior (منطق controller)
 * - collaboratorId = req.user.userId
 * - courseId = req.params.id
 *
 * 1) قبل از تغییر status، کورس از نظر کامل بودن validate می‌شود:
 *    validateCourseForSubmit({ courseId, instructorId: collaboratorId })
 *
 *    اگر ok نبود => 400 و این خروجی را می‌دهد:
 *    {
 *      message: "Course is not ready for submission",
 *      errors: [...],
 *      warnings: [...]
 *    }
 *
 *    ✅ errors: چیزهایی که باید حتماً درست شود (blocking)
 *    ✅ warnings: هشدارها (blocking نیست، ولی برمی‌گردد تا فرانت نمایش بده)
 *
 * 2) سپس کورس را با شرط مالکیت پیدا می‌کند:
 *    Course.findOne({ _id: courseId, instructorId: collaboratorId })
 *    اگر پیدا نشد => 404 "Course not found"
 *
 * 3) فقط این status ها اجازه submit دارند:
 *    - draft
 *    - rejected
 *    اگر status چیز دیگری بود => 400
 *      { message: `Course cannot be submitted from status: ${course.status}` }
 *
 * 4) اگر همه چیز ok بود:
 *    - course.status = "under_review"
 *    - course.submittedAt = new Date()
 *    - save()
 *
 * -----------------------------------------------------------------------------------------------
 * @success 200
 * {
 *   "message": "Course submitted for review",
 *   "course": { "id": "...", "status": "under_review" },
 *   "warnings": [...]
 * }
 *
 * -----------------------------------------------------------------------------------------------
 * @common errors (برای فرانت خیلی مهم)
 * - 400 { message: "Course is not ready for submission", errors: [...], warnings: [...] }
 * - 404 { message: "Course not found" }
 * - 400 { message: "Course cannot be submitted from status: under_review|approved|published|..." }
 * - 401 Unauthorized
 * - 403 Forbidden
 *
 * -----------------------------------------------------------------------------------------------
 * 🔁 جریان کاری سیستم (Workflow)
 * - collaborator:
 *   draft/rejected  -> (submit) -> under_review
 * - admin:
 *   under_review -> approve/reject  (routes ادمین که قبلاً دادی)
 * - بعداً:
 *   approved -> publish
 */
router.post("/:id/submit", auth, requireRoles(["collaborator", "admin"]), submitCourseForReview);

module.exports = router;
