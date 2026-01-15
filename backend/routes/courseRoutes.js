// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const {
//   createCourse,
//   getMyCourses,
//   getMyCourseById,
//   updateMyCourse,
//   deleteMyCourse,
// } = require("../controllers/courseController");

// // collaborator (و admin هم اگر خواستی) اجازه دارد
// router.post("/", auth, requireRoles(["collaborator", "admin"]), createCourse);
// router.get("/", auth, requireRoles(["collaborator", "admin"]), getMyCourses);
// router.get("/:courseId", auth, requireRoles(["collaborator", "admin"]), getMyCourseById);
// router.patch("/:courseId", auth, requireRoles(["collaborator", "admin"]), updateMyCourse);
// router.delete("/:courseId", auth, requireRoles(["collaborator", "admin"]), deleteMyCourse);

// module.exports = router;
/**
 * Course Routes (مسیـرهای مدیریت کورس برای کولابراتور) (Course Management Routes)
 * -------------------------------------------------------------------------------------------------
 * این فایل CRUD کورس‌ها را برای صاحب کورس (collaborator) فراهم می‌کند:
 * 1) ساخت کورس (Draft)
 * 2) لیست کورس‌های خودم
 * 3) گرفتن یک کورس مشخص (فقط کورس خودم)
 * 4) آپدیت کورس خودم با قوانین خاص وضعیت‌ها
 * 5) حذف کورس خودم با محدودیت وضعیت‌ها
 *
 * ✅ تمام مسیرها Protected هستند:
 * - auth (JWT) لازم است
 * - requireRoles(["collaborator","admin"]) لازم است
 *
 * ⚠️ نکته مهم (خیلی مهم برای فرانت/AI):
 * - تمام query ها با instructorId = req.user.userId محدود شده
 * - یعنی در عمل هر کسی فقط کورس‌های خودش را می‌بیند/ادیت می‌کند.
 * - اگر admin هم این endpoint ها را بزند، باز هم فقط کورس‌های مربوط به همان userId خودش را می‌گیرد
 *   (مگر اینکه controller را تغییر بدهی و admin override داشته باشد.)
 *
 * -------------------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر یک مسیر مثل این mount می‌شود:
 *   app.use("/courses", router)
 * یا اگر مخصوص کولابراتور باشد:
 *   app.use("/collab/courses", router)
 *
 * بر اساس mount، endpoint ها یکی از این دو شکل می‌شود.
 * من اینجا endpoint ها را "نسبت به mount" توضیح می‌دهم.
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const {
  createCourse,
  getMyCourses,
  getMyCourseById,
  updateMyCourse,
  deleteMyCourse,
} = require("../controllers/courseController");

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 1) Create Course (ساخت کورس جدید) (Create Draft Course)
 * -------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /
 * @access   Private (collaborator|admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["collaborator","admin"])
 *
 * @body (required)
 * {
 *   "title": "string",
 *   "shortDesc": "string",
 *   "category": "MongoId",         // required
 *   "startDate": "2026-01-12",     // optional (ISO date string)
 *   "duration": "6 weeks"         // optional
 * }
 *
 * @behavior (منطق controller)
 * - title/shortDesc/category اجباری هستند
 * - category باید ObjectId معتبر باشد
 * - category باید موجود و isActive=true باشد (وگرنه 400)
 * - کورس با status="draft" ساخته می‌شود
 * - instructorId = req.user.userId ست می‌شود (مالک کورس)
 *
 * @success 201
 * {
 *   "message": "Course created (draft)",
 *   "course": { ...full course doc... }
 * }
 *
 * @errors
 * - 400 { message: "title, shortDesc, category are required" }
 * - 400 { message: "Invalid category id" }
 * - 400 { message: "Category not found or inactive" }
 * - 401 Unauthorized
 * - 403 Forbidden (insufficient role)
 */
router.post("/", auth, requireRoles(["collaborator", "admin"]), createCourse);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 2) Get My Courses (لیست کورس‌های من) (List My Courses)
 * -------------------------------------------------------------------------------------------------
 * @method   GET
 * @route    /
 * @access   Private (collaborator|admin)
 *
 * @behavior
 * - فقط کورس‌های instructorId=req.user.userId
 * - populate category: { name, slug }
 * - sort: جدیدترین اول
 *
 * @success 200
 * { "courses": [ ... ] }
 *
 * @errors
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.get("/", auth, requireRoles(["collaborator", "admin"]), getMyCourses);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 3) Get My Course By Id (گرفتن یک کورس مشخص) (Get Single My Course)
 * -------------------------------------------------------------------------------------------------
 * @method   GET
 * @route    /:courseId
 * @access   Private (collaborator|admin)
 *
 * @params
 * - courseId: MongoId
 *
 * @behavior
 * - اگر courseId معتبر نبود => 400
 * - کورس فقط اگر مال خود کاربر باشد پیدا می‌شود (owner check)
 * - category populate می‌شود
 *
 * @success 200
 * { "course": { ... } }
 *
 * @errors
 * - 400 { message: "Invalid course id" }
 * - 404 { message: "Course not found" }
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.get("/:courseId", auth, requireRoles(["collaborator", "admin"]), getMyCourseById);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 4) Update My Course (آپدیت کورس من) (Update Course With Status Rules)
 * -------------------------------------------------------------------------------------------------
 * @method   PATCH
 * @route    /:courseId
 * @access   Private (collaborator|admin)
 *
 * @params
 * - courseId: MongoId
 *
 * @body (optional fields)
 * فقط همین فیلدها اجازه update دارند:
 * - title
 * - shortDesc
 * - startDate
 * - duration
 * - category
 *
 * ✅ قوانین وضعیت‌ها (خیلی مهم برای فرانت)
 * 1) اگر کورس under_review باشد => ادیت ممنوع
 *    => 400 { message: "Course is under review. You cannot edit now." }
 *
 * 2) اگر کورس published یا approved باشد و شما تغییر بدهی:
 *    - course.needsReReview = true
 *    - course.status = "draft"   (برمی‌گردد draft تا دوباره submit شود)
 *    - course.isLocked = false
 *    - course.lockedFields = [لیست فیلدهایی که تغییر داده‌ای]
 *    => پیام:
 *      "Course updated. It is now draft and requires re-review."
 *
 * 3) اگر category تغییر کند:
 *    - باید ObjectId معتبر باشد
 *    - باید Category موجود و isActive=true باشد
 *
 * @success 200
 * {
 *   "message": "Course updated" | "Course updated. It is now draft and requires re-review.",
 *   "course": { ... }
 * }
 *
 * @errors
 * - 400 Invalid course id
 * - 404 Course not found
 * - 400 Course is under review...
 * - 400 Invalid category id
 * - 400 Category not found or inactive
 */
router.patch("/:courseId", auth, requireRoles(["collaborator", "admin"]), updateMyCourse);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 5) Delete My Course (حذف کورس من) (Delete Course With Status Rules)
 * -------------------------------------------------------------------------------------------------
 * @method   DELETE
 * @route    /:courseId
 * @access   Private (collaborator|admin)
 *
 * @rules
 * - اگر published باشد => حذف ممنوع
 * - اگر under_review باشد => حذف ممنوع
 * - اگر draft/rejected/approved (غیر منتشر) باشد => حذف مجاز
 *
 * @success 200
 * { "message": "Course deleted" }
 *
 * @errors
 * - 400 Invalid course id
 * - 404 Course not found
 * - 400 Published course cannot be deleted
 * - 400 Course under review cannot be deleted
 */
router.delete("/:courseId", auth, requireRoles(["collaborator", "admin"]), deleteMyCourse);

module.exports = router;
