// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const {
//   listChangeRequests,
//   approveChangeRequest,
//   rejectChangeRequest,
// } = require("../controllers/adminChangeRequestController");

// // GET /admin/change-requests?status=pending
// router.get("/change-requests", auth, requireRoles(["admin"]), listChangeRequests);

// // POST /admin/change-requests/:id/approve
// router.post("/change-requests/:id/approve", auth, requireRoles(["admin"]), approveChangeRequest);

// // POST /admin/change-requests/:id/reject  body: { feedback }
// router.post("/change-requests/:id/reject", auth, requireRoles(["admin"]), rejectChangeRequest);

// module.exports = router;
/**
 * Admin Change Requests Routes (مسیرهای ادمین برای درخواست‌های تغییر کورس)
 * ----------------------------------------------------------------------
 * این فایل مخصوص ادمین است برای مدیریت "Course Change Request" ها:
 *  1) لیست گرفتن درخواست‌ها (با فیلتر)
 *  2) approve کردن و اعمال واقعی تغییرات روی Course/Curriculum
 *  3) reject کردن با feedback
 *
 * ✅ چرا این فایل مهم است؟
 * - فرانت‌اندی که فقط این روت‌ها را داشته باشد، می‌فهمد دقیقاً:
 *   - چه endpoint هایی دارد
 *   - چه query/params/body می‌خواهد
 *   - چه جواب و چه خطاهایی برمی‌گرداند
 *
 * ----------------------------------------------------------------------
 * 🔐 Security / Access (امنیت و دسترسی)
 *
 * Middlewares:
 * 1) auth (JWT Authentication):
 *    - Token را از این دو جا می‌گیرد:
 *      a) Cookie: req.cookies.access_token
 *      b) Header: Authorization: Bearer <token>
 *    - اگر token نبود => 401 Unauthorized (token missing)
 *    - اگر JWT_SECRET نبود => 500 Server misconfig
 *    - اگر token expired بود => 401 Unauthorized (token expired)
 *    - اگر token invalid بود => 401 Unauthorized (invalid token)
 *    - اگر موفق بود => req.user را اینطور می‌سازد:
 *      req.user = { userId: decoded.userId, roles: decoded.roles || [] }
 *
 * 2) requireRoles(["admin"]) (RBAC):
 *    - فقط user که در req.user.roles نقش "admin" داشته باشد اجازه دارد
 *    - اگر نقش نداشت => 403 Forbidden (insufficient role)
 *      { message: "Forbidden (insufficient role)", required: ["admin"] }
 *
 * ----------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * این router معمولاً زیر یک مسیر مثل این mount می‌شود:
 *   app.use("/admin", router)
 * در این حالت endpoint ها می‌شود:
 *   GET  /admin/change-requests
 *   POST /admin/change-requests/:id/approve
 *   POST /admin/change-requests/:id/reject
 *
 * اگر base شما فرق دارد، همین‌ها نسبت به base حساب می‌شود.
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const {
  listChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
} = require("../controllers/adminChangeRequestController");

/**
 * ----------------------------------------------------------------------
 * ✅ 1) List Change Requests (لیست درخواست‌های تغییر)
 * ----------------------------------------------------------------------
 * @method   GET
 * @route    /change-requests
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @description
 * - درخواست‌های تغییر کورس را برمی‌گرداند.
 * - قابلیت فیلتر با Query String را دارد:
 *
 * @query params (اختیاری)
 * - status: "pending" | "approved" | "rejected"
 * - courseId: <MongoId of Course>
 *
 * @examples
 * - GET /admin/change-requests?status=pending
 * - GET /admin/change-requests?courseId=65f...123
 * - GET /admin/change-requests?status=pending&courseId=65f...123
 *
 * @response 200
 * {
 *   "changeRequests": [
 *     {
 *       "_id": "...",
 *       "status": "pending",
 *       "type": "course_details" | "curriculum_add" | "curriculum_update",
 *       "payload": { ... },
 *       "requestedBy": { "name": "...", "email": "...", "roles": [...] },
 *       "courseId": { "title": "...", "status": "published", "instructorId": "..." },
 *       "createdAt": "...",
 *       ...
 *     }
 *   ]
 * }
 *
 * @common errors
 * - 401 Unauthorized (token missing/expired/invalid)
 * - 403 Forbidden (insufficient role)
 */
router.get("/change-requests", auth, requireRoles(["admin"]), listChangeRequests);

/**
 * ----------------------------------------------------------------------
 * ✅ 2) Approve + Apply Change Request (تایید و اعمال درخواست تغییر)
 * ----------------------------------------------------------------------
 * @method   POST
 * @route    /change-requests/:id/approve
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - id: <MongoId of CourseChangeRequest>
 *
 * @description (خیلی مهم)
 * این endpoint فقط "approve" نمی‌کند؛ بلکه واقعاً تغییرات را هم روی دیتابیس اعمال می‌کند:
 * - اول بررسی می‌کند درخواست وجود دارد و status آن "pending" است
 * - کورس مربوطه باید وجود داشته باشد
 * - کورس باید "published" باشد، وگرنه اجازه اعمال تغییر را نمی‌دهد
 *
 * ✅ انواع Change Request که پشتیبانی می‌شود (cr.type):
 *
 * 1) "course_details"
 *    - تغییر برخی فیلدهای محدود کورس:
 *      allowed fields: ["title", "shortDesc", "startDate", "duration", "category"]
 *    - payload نمونه:
 *      {
 *        "title": "...",
 *        "shortDesc": "...",
 *        "startDate": "2026-01-20",
 *        "duration": 30,
 *        "category": "..."
 *      }
 *
 * 2) "curriculum_add"
 *    - اضافه کردن یک CurriculumItem جدید به یک Section از همان کورس
 *    - payload ساختار:
 *      {
 *        "sectionId": "<CourseSectionId>",
 *        "item": {
 *          "type": "article" | "video" | "quiz" | "attachment",
 *          "title": "...",
 *          "order": 1,
 *
 *          // اگر type=article:
 *          "contentHtml": "<p>...</p>",
 *          "contentJson": {...},
 *
 *          // اگر type=video:
 *          "youtubeUrl": "https://youtu.be/....",
 *          "videoLengthMinutes": 10,
 *          "isUnlistedDeclared": true,
 *          "notesForAdminUpload": "..."
 *
 *          // اگر type=quiz:
 *          "quiz": { "questions": [...], "totalScore": 0 }
 *
 *          // اگر type=attachment:
 *          "fileUrl": "https://..."
 *        }
 *      }
 *
 *    - نکات اعتبارسنجی:
 *      - sectionId باید متعلق به همین course باشد
 *      - برای article: حداقل یکی از contentHtml یا contentJson باید باشد
 *      - برای video: youtubeUrl باید معتبر باشد (Regex نرم)
 *      - برای attachment: fileUrl ضروری است
 *      - آیتم جدید با status="approved" ساخته می‌شود چون ادمین approve کرده
 *
 * 3) "curriculum_update"
 *    - آپدیت یک CurriculumItem موجود در همان کورس
 *    - payload:
 *      {
 *        "itemId": "<CurriculumItemId>",
 *        "updates": { ...fieldsToUpdate }
 *      }
 *
 *    - فیلدهای ممنوع (هر کدام داخل updates بیاید => 400):
 *      ["_id","courseId","sectionId","status","createdBy","deleted","isDeleted"]
 *
 *    - اگر آیتم video باشد و youtubeUrl تغییر کند => دوباره validate می‌شود
 *
 * ----------------------------------------------------------------------
 * @success behavior
 * - اگر همه چیز ok بود:
 *   - cr.status = "approved"
 *   - cr.reviewedBy = adminId
 *   - cr.reviewedAt, cr.appliedAt set می‌شود
 *   - پاسخ:
 *     200 { message: "Change request approved and applied" }
 *
 * @possible errors (خیلی کاربردی برای فرانت)
 * - 404 { message: "Change request not found" }
 * - 400 { message: "Cannot approve request with status: approved/rejected" }
 * - 404 { message: "Course not found" }
 * - 400 { message: "Course is not published anymore. Cannot apply change request." }
 * - 400 { message: "Section not found for this course" }
 * - 400 { message: "Article content is required" }
 * - 400 { message: "Invalid YouTube URL" }
 * - 400 { message: "fileUrl is required for attachment" }
 * - 400 { message: "Item not found for this course" }
 * - 400 { message: "Forbidden update field: status" }  (یا هر فیلد ممنوع)
 * - 401 / 403 (مشابه بالا)
 */
router.post(
  "/change-requests/:id/approve",
  auth,
  requireRoles(["admin"]),
  approveChangeRequest
);

/**
 * ----------------------------------------------------------------------
 * ✅ 3) Reject Change Request (رد کردن درخواست تغییر)
 * ----------------------------------------------------------------------
 * @method   POST
 * @route    /change-requests/:id/reject
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - id: <MongoId of CourseChangeRequest>
 *
 * @body (اختیاری ولی بهتر است بفرستی)
 * - feedback: string
 *
 * @example
 * POST /admin/change-requests/65f...abc/reject
 * body:
 *   { "feedback": "لطفاً ویدیو را با لینک درست بفرست" }
 *
 * @behavior
 * - فقط وقتی cr.status === "pending" باشد اجازه رد کردن دارد
 * - اگر feedback خالی باشد، سیستم می‌گذارد:
 *   "Rejected by admin"
 * - این فیلدها set می‌شود:
 *   cr.status = "rejected"
 *   cr.adminFeedback = feedback || "Rejected by admin"
 *   cr.reviewedBy = adminId
 *   cr.reviewedAt = new Date()
 *
 * @response 200
 *   { "message": "Change request rejected" }
 *
 * @possible errors
 * - 404 { message: "Change request not found" }
 * - 400 { message: "Cannot reject request with status: approved/rejected" }
 * - 401 / 403 (مشابه بالا)
 */
router.post(
  "/change-requests/:id/reject",
  auth,
  requireRoles(["admin"]),
  rejectChangeRequest
);

module.exports = router;
