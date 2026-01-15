// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");
// const requireCourseOwner = require("../middleware/requireCourseOwner");
// const {  getMyQuizAttempts } = require("../controllers/quizAttemptController");

// const {
//   createQuizItem,
//   updateQuizItem,
//   submitQuiz,
// } = require("../controllers/quizController");

// // collaborator/admin (owner) => create quiz item
// router.post(
//   "/:courseId/sections/:sectionId/quizzes",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   createQuizItem
// );

// // collaborator/admin (owner) => update quiz item
// router.patch(
//   "/:courseId/quizzes/:itemId",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   updateQuizItem
// );

// // student/admin => submit quiz
// router.post(
//   "/:courseId/quizzes/:itemId/submit",
//   auth,
//   requireRoles(["student", "admin"]),
//   submitQuiz
// );

// module.exports = router;





// // ✅ POST /courses/:id/quizzes/:itemId/submit
// router.post("/:id/quizzes/:itemId/submit", auth, requireRoles(["student", "admin"]), submitQuiz);

// // ✅ GET history
// router.get("/:id/quizzes/:itemId/attempts", auth, requireRoles(["student", "admin"]), getMyQuizAttempts);

// module.exports = router;
const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const requireCourseOwner = require("../middleware/requireCourseOwner");

const { getMyQuizAttempts } = require("../controllers/quizAttemptController");
const { createQuizItem, updateQuizItem, submitQuiz } = require("../controllers/quizController");

/**
 * =============================================================================
 * Quiz Routes API Contract (LMS) — مسیرهای کوییز (Quiz)
 * =============================================================================
 *
 * هدف این فایل:
 * - مدیریت کوییز داخل کورس‌ها (Course) به دو بخش اصلی:
 *   1) بخش استاد/کولابراتور (Collaborator/Admin):
 *      ✅ ساخت کوییز داخل یک سکشن (Section)
 *      ✅ آپدیت کوییز
 *
 *   2) بخش شاگرد (Student/Admin):
 *      ✅ ارسال جواب‌های کوییز (Submit)
 *      ✅ دیدن تاریخچه تلاش‌ها (Attempts history)
 *
 * احراز هویت (Authentication):
 * - همه مسیرها protected هستند:
 *   Middleware: auth
 *   - توکن را از Cookie: access_token یا Header: Authorization Bearer می‌گیرد
 *   - req.user = { userId, roles } را set می‌کند
 *
 * نقش‌ها (Authorization / Roles):
 * - برای ساخت/آپدیت کوییز:
 *   roles: collaborator | admin
 *   + requireCourseOwner:
 *     - فقط مالک کورس (instructorId) یا admin اجازه دارد روی کورس تغییر بدهد
 *
 * - برای submit و attempts:
 *   roles: student | admin
 *   - معمولاً شرط‌های بیزنسی داخل controller چک می‌شود مثل:
 *     - شاگرد باید enroll باشد
 *     - کوییز باید قابل دسترس باشد (مثلاً approved)
 *
 * BASE PATH (مهم برای فرانت):
 * - این فایل معمولاً زیر /courses mount می‌شود، مثال:
 *   app.use("/courses", quizRoutes)
 *
 * - اگر همینطور mount شود، مسیرهای نهایی این‌ها می‌شوند:
 *   POST   /courses/:courseId/sections/:sectionId/quizzes
 *   PATCH  /courses/:courseId/quizzes/:itemId
 *   POST   /courses/:courseId/quizzes/:itemId/submit
 *   GET    /courses/:courseId/quizzes/:itemId/attempts
 *
 * Frontend Note (Cookie Auth):
 * - اگر auth با cookie است:
 *   fetch => { credentials: "include" }
 *   axios => { withCredentials: true }
 * =============================================================================
 */

/**
 * -----------------------------------------------------------------------------
 * 1) CREATE QUIZ (Collaborator/Admin Owner)
 * -----------------------------------------------------------------------------
 * POST /courses/:courseId/sections/:sectionId/quizzes
 *
 * PURPOSE:
 * - ساخت یک آیتم کوییز (Quiz Item) داخل یک سکشن مشخص از یک کورس مشخص.
 * - این معمولاً یک CurriculumItem با type="quiz" می‌سازد.
 *
 * AUTH:
 * - Required ✅ auth
 *
 * ROLES:
 * - collaborator | admin
 *
 * OWNER CHECK:
 * - requireCourseOwner ✅
 *   - اگر admin باشی: رد نمی‌شوی
 *   - اگر collaborator باشی: باید instructorId کورس == req.user.userId باشد
 *
 * PARAMS:
 * - courseId: id کورس
 * - sectionId: id سکشن
 *
 * BODY (JSON) — معمولاً:
 * {
 *   "title": "Quiz 1",                 // required
 *   "order": 1,                       // optional (default 0)
 *   "questions": [                    // required (حداقل 1 سوال)
 *     {
 *       "questionText": "....",
 *       "questionType": "single"|"multi",
 *       "options": ["A","B","C","D"], // دقیقاً 4 گزینه
 *       "correctAnswerIndexes": [1],  // single => یک عدد، multi => چند عدد
 *       "score": 1                    // optional
 *     }
 *   ]
 * }
 *
 * BUSINESS RULES (طبق controller):
 * - questions نباید خالی باشد
 * - هر سوال باید 4 گزینه داشته باشد
 * - برای single دقیقاً 1 جواب صحیح
 * - برای multi حداقل 1 جواب صحیح
 *
 * SUCCESS:
 * - 201 Created:
 *   { message: "Quiz item created", item: {...} }
 *
 * COMMON ERRORS:
 * - 400: title/questions invalid
 * - 401: Unauthorized (token missing/invalid)
 * - 403: Forbidden (role/owner)
 * - 404: Section not found
 */
router.post(
  "/:courseId/sections/:sectionId/quizzes",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  createQuizItem
);

/**
 * -----------------------------------------------------------------------------
 * 2) UPDATE QUIZ (Collaborator/Admin Owner)
 * -----------------------------------------------------------------------------
 * PATCH /courses/:courseId/quizzes/:itemId
 *
 * PURPOSE:
 * - آپدیت عنوان/ترتیب/سوالات یک کوییز موجود.
 *
 * AUTH:
 * - Required ✅ auth
 *
 * ROLES:
 * - collaborator | admin
 *
 * OWNER CHECK:
 * - requireCourseOwner ✅
 *
 * PARAMS:
 * - courseId: id کورس
 * - itemId: id آیتم کوییز (CurriculumItem)
 *
 * BODY (JSON) — فیلدهای رایج:
 * {
 *   "title": "New title",     // optional
 *   "order": 2,              // optional
 *   "questions": [ ... ]     // optional (اما اگر ارسال شد باید valid باشد)
 * }
 *
 * BUSINESS RULES:
 * - اگر کوییز under_review باشد ممکن است ادیت ممنوع باشد (طبق controller)
 * - اگر کورس published باشد، ممکن است تغییر باعث نیاز به review دوباره شود
 *
 * SUCCESS:
 * - 200 OK:
 *   { message: "Quiz item updated", item: {...} }
 *
 * COMMON ERRORS:
 * - 400: item is under_review / invalid questions
 * - 401: Unauthorized
 * - 403: Forbidden (role/owner)
 * - 404: Quiz item not found
 */
router.patch(
  "/:courseId/quizzes/:itemId",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  updateQuizItem
);

/**
 * -----------------------------------------------------------------------------
 * 3) SUBMIT QUIZ (Student/Admin)
 * -----------------------------------------------------------------------------
 * POST /courses/:courseId/quizzes/:itemId/submit
 *
 * PURPOSE:
 * - شاگرد جواب‌های کوییز را ارسال می‌کند و سیستم نمره‌دهی کرده
 *   یک Attempt (تلاش) ثبت می‌کند.
 *
 * AUTH:
 * - Required ✅ auth
 *
 * ROLES:
 * - student | admin
 *
 * PARAMS:
 * - courseId: id کورس
 * - itemId: id آیتم کوییز
 *
 * BODY (JSON) — فرمت جواب‌ها (Answers) باید مطابق منطق submitQuiz باشد.
 * چون در پروژه‌ها معمولاً چند فرمت ساپورت می‌شود، بهترین و واضح‌ترین فرمت پیشنهادی:
 *
 * ✅ پیشنهاد استاندارد برای فرانت:
 * {
 *   "answers": [
 *     { "questionIndex": 0, "selectedIndexes": [1] },       // single
 *     { "questionIndex": 1, "selectedIndexes": [0,2] }      // multi
 *   ]
 * }
 *
 * BUSINESS RULES (طبق controller):
 * - شاگرد باید قبلاً enroll باشد (Enrollment موجود)
 * - کوییز باید قابل دسترس باشد (معمولاً approved)
 * - سیستم نمره محاسبه می‌کند و Attempt ذخیره می‌شود
 * - ممکن است محدودیت attempt هم وجود داشته باشد (اگر در controller فعال باشد)
 *
 * SUCCESS:
 * - 200 OK یا 201 Created (بسته به controller):
 *   {
 *     message: "Quiz submitted",
 *     result: {
 *       attemptId,
 *       attemptNo/attemptNumber,
 *       totalScore/score,
 *       maxScore,
 *       percentage/percent,
 *       breakdown?, passed?, attemptsLeft?
 *     }
 *   }
 *
 * COMMON ERRORS:
 * - 400: quiz not available / invalid answers format
 * - 401: Unauthorized
 * - 403: must enroll before submit
 * - 404: quiz not found
 */
router.post(
  "/:courseId/quizzes/:itemId/submit",
  auth,
  requireRoles(["student", "admin"]),
  submitQuiz
);

/**
 * -----------------------------------------------------------------------------
 * 4) GET QUIZ ATTEMPTS HISTORY (Student/Admin)
 * -----------------------------------------------------------------------------
 * GET /courses/:courseId/quizzes/:itemId/attempts
 *
 * PURPOSE:
 * - گرفتن لیست تلاش‌های قبلی شاگرد برای یک کوییز مشخص.
 * - برای صفحه‌ی "Attempts History" یا نمایش نتیجه‌های قبلی استفاده می‌شود.
 *
 * AUTH:
 * - Required ✅ auth
 *
 * ROLES:
 * - student | admin
 *
 * PARAMS:
 * - courseId: id کورس
 * - itemId: id آیتم کوییز
 *
 * SUCCESS:
 * - 200 OK:
 *   { attempts: [ ... ] }
 *
 * COMMON ERRORS:
 * - 401 Unauthorized
 * - 403 اگر شاگرد enroll نباشد (معمولاً در controller چک می‌شود)
 */
router.get(
  "/:courseId/quizzes/:itemId/attempts",
  auth,
  requireRoles(["student", "admin"]),
  getMyQuizAttempts
);

module.exports = router;
