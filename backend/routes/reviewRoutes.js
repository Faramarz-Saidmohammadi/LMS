// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");
// const { createOrUpdateReview } = require("../controllers/reviewController");

// // POST /courses/:id/reviews
// router.post("/:id/reviews", auth, requireRoles(["student", "admin"]), createOrUpdateReview);

// module.exports = router;
const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const { createOrUpdateReview } = require("../controllers/reviewController");

/**
 * =============================================================================
 * Reviews Routes API Contract (LMS) — مسیرهای ریویو/امتیاز کورس (Reviews)
 * =============================================================================
 *
 * هدف این فایل:
 * - شاگرد (Student) بعد از enroll کردن در یک کورس published،
 *   بتواند به کورس امتیاز (rating) بدهد و نظر (comment) ثبت کند.
 * - اگر قبلاً ریویو داده باشد، همان ریویو آپدیت می‌شود (Upsert).
 *
 * AUTH (Authentication):
 * - همه مسیرها protected هستند ✅
 * - Middleware: auth
 *   - توکن را از Cookie: access_token یا Header: Authorization Bearer می‌گیرد
 *   - req.user = { userId, roles } را set می‌کند
 *
 * Roles (Authorization):
 * - فقط این نقش‌ها اجازه دارند:
 *   student | admin
 *
 * BASE PATH (مهم برای فرانت):
 * - معمولاً این فایل زیر /courses mount می‌شود:
 *   app.use("/courses", reviewRoutes)
 *
 * - پس مسیر نهایی:
 *   POST /courses/:id/reviews
 *
 * Frontend Note (Cookie Auth):
 * - اگر سیستم با cookie کار می‌کند:
 *   fetch => { credentials: "include" }
 *   axios => { withCredentials: true }
 * =============================================================================
 */

/**
 * -----------------------------------------------------------------------------
 * 1) CREATE OR UPDATE REVIEW (Student/Admin)
 * -----------------------------------------------------------------------------
 * POST /courses/:id/reviews
 *
 * PURPOSE:
 * - ثبت ریویو برای کورس (rating + comment)
 * - اگر قبلاً همین شاگرد برای همین کورس ریویو داده باشد:
 *   همان ریویو آپدیت می‌شود (findOneAndUpdate + upsert)
 *
 * AUTH:
 * - Required ✅ auth
 *
 * ROLES:
 * - student | admin
 *
 * PARAMS:
 * - id: courseId (ObjectId)
 *
 * BODY (JSON):
 * {
 *   "rating": 1..5,          // required (integer بین 1 تا 5)
 *   "comment": "..."         // optional (string) — default: ""
 * }
 *
 * BUSINESS RULES (طبق controller):
 * 1) courseId باید ObjectId معتبر باشد
 * 2) rating باید عدد صحیح بین 1 تا 5 باشد
 * 3) کورس باید موجود باشد و status="published" باشد
 * 4) شاگرد باید قبلاً در کورس enroll شده باشد
 *    (Enrollment must exist)
 * 5) comment trim می‌شود
 *
 * SUCCESS:
 * - 201 Created:
 *   {
 *     "message": "Review saved",
 *     "review": { ... }      // review document
 *   }
 *
 * NOTE:
 * - اگر race condition و unique index خطا بدهد (code=11000)
 *   سیستم ریویو موجود را می‌خواند و با 200 برمی‌گرداند.
 *
 * COMMON ERRORS:
 * - 400:
 *   - Invalid course id
 *   - rating must be an integer between 1 and 5
 *   - You must enroll in this course before leaving a review
 * - 401:
 *   - Unauthorized (token missing/invalid/expired)
 * - 403:
 *   - Forbidden (insufficient role)
 * - 404:
 *   - Course not found or not published
 */
router.post("/:id/reviews", auth, requireRoles(["student", "admin"]), createOrUpdateReview);

module.exports = router;
