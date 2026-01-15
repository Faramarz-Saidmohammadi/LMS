// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const {
//   getCourseItems,
//   approveItem,
//   rejectItem,
// } = require("../controllers/adminItemController");

// // GET /admin/courses/:courseId/items?status=under_review
// router.get("/courses/:courseId/items", auth, requireRoles(["admin"]), getCourseItems);

// // POST /admin/items/:itemId/approve
// router.post("/items/:itemId/approve", auth, requireRoles(["admin"]), approveItem);

// // POST /admin/items/:itemId/reject
// router.post("/items/:itemId/reject", auth, requireRoles(["admin"]), rejectItem);

// module.exports = router;
/**
 * Admin Items Moderation Routes (مسیرهای بررسی/تایید/رد آیتم‌های کورس توسط ادمین)
 * -----------------------------------------------------------------------------
 * این فایل مخصوص ادمین است برای مدیریت آیتم‌های کورس (Curriculum Items) مثل:
 *  - مقاله (article)
 *  - ویدیو (video)
 *  - کوییز (quiz)
 *  - فایل (attachment)
 *
 * ✅ این فایل 3 تا endpoint دارد:
 * 1) لیست آیتم‌های یک کورس (با فیلتر status)
 * 2) approve کردن یک آیتم (فقط under_review)
 * 3) reject کردن یک آیتم با feedbackText (فقط under_review)
 *
 * -----------------------------------------------------------------------------
 * 🔐 Security / Access (امنیت و دسترسی)
 * همه مسیرها private هستند و فقط admin اجازه دارد.
 *
 * Middlewares:
 * 1) auth (JWT Authentication)
 *    - token را از Cookie یا Authorization header می‌گیرد
 *    - اگر token نبود => 401 Unauthorized (token missing)
 *    - اگر JWT_SECRET نبود => 500 Server misconfig
 *    - اگر token expired => 401 Unauthorized (token expired)
 *    - اگر token invalid => 401 Unauthorized (invalid token)
 *    - اگر ok => req.user = { userId, roles }
 *
 * 2) requireRoles(["admin"]) (RBAC)
 *    - فقط admin اجازه دارد
 *    - اگر نقش کافی نبود => 403 Forbidden (insufficient role)
 *      { message: "Forbidden (insufficient role)", required: ["admin"] }
 *
 * -----------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر یک مسیر مثل این mount می‌شود:
 *   app.use("/admin", router)
 *
 * پس endpoint ها می‌شود:
 *   GET  /admin/courses/:courseId/items?status=
 *   POST /admin/items/:itemId/approve
 *   POST /admin/items/:itemId/reject
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const {
  getCourseItems,
  approveItem,
  rejectItem,
} = require("../controllers/adminItemController");

/**
 * -----------------------------------------------------------------------------
 * ✅ 1) Get Course Items (لیست آیتم‌های یک کورس برای ادمین) (Get Items By Course)
 * -----------------------------------------------------------------------------
 * @method   GET
 * @route    /courses/:courseId/items
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - courseId: MongoId (required)
 *
 * @query params (اختیاری)
 * - status: string
 *   مثال: under_review | approved | rejected | ... (بسته به مدل CurriculumItem)
 *
 * @example
 * - GET /admin/courses/65f...123/items
 * - GET /admin/courses/65f...123/items?status=under_review
 *
 * @behavior (منطق controller)
 * - اگر courseId معتبر نبود => 400 { message: "Invalid courseId" }
 * - filter = { courseId } و اگر status بود => { courseId, status }
 * - آیتم‌ها از CurriculumItem خوانده می‌شود و:
 *   - populate("createdBy", "name email")  => سازنده آیتم را نشان می‌دهد
 *   - sort({ updatedAt: -1 })             => جدیدترین تغییرات اول
 *
 * @response 200
 * {
 *   "items": [
 *     {
 *       "_id": "...",
 *       "courseId": "...",
 *       "title": "...",
 *       "type": "video|article|quiz|attachment",
 *       "status": "under_review|approved|rejected",
 *       "createdBy": { "_id": "...", "name": "...", "email": "..." },
 *       "updatedAt": "...",
 *       ...
 *     }
 *   ]
 * }
 *
 * @common errors
 * - 400 { message: "Invalid courseId" }
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.get("/courses/:courseId/items", auth, requireRoles(["admin"]), getCourseItems);

/**
 * -----------------------------------------------------------------------------
 * ✅ 2) Approve Item (تایید آیتم) (Approve Curriculum Item)
 * -----------------------------------------------------------------------------
 * @method   POST
 * @route    /items/:itemId/approve
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - itemId: MongoId (required)
 *
 * @rules (قواعد)
 * - اگر itemId معتبر نبود:
 *   400 { message: "Invalid itemId" }
 * - اگر آیتم پیدا نشد:
 *   404 { message: "Item not found" }
 * - فقط آیتم‌هایی که status="under_review" باشند قابل approve هستند:
 *   400 { message: "Only under_review items can be approved" }
 *
 * @side effects (کارهای جانبی)
 * 1) item.status => "approved"
 * 2) پاک کردن rejectFeedback:
 *    item.rejectFeedback = { message:"", by:null, at:null }
 * 3) ثبت تاریخچه بررسی (reviewHistory):
 *    { action:"approved", message:"", by: adminId, at: Date }
 * 4) ایجاد notification برای سازنده آیتم (createdBy):
 *    type: "item_approved"
 *    payload: { courseId, itemId }
 * 5) اگر دیگر آیتم under_review در همان course نبود:
 *    - pending = countDocuments({ courseId, status:"under_review" })
 *    - اگر pending === 0 و course.status === "published"
 *      => course.needsReReview = false
 *
 * @response 200
 * {
 *   "message": "Item approved",
 *   "item": { "id": "...", "status": "approved" }
 * }
 *
 * @common errors
 * - 400 / 404 طبق بالا
 * - 401 / 403
 */
router.post("/items/:itemId/approve", auth, requireRoles(["admin"]), approveItem);

/**
 * -----------------------------------------------------------------------------
 * ✅ 3) Reject Item (رد آیتم با فیدبک) (Reject Curriculum Item)
 * -----------------------------------------------------------------------------
 * @method   POST
 * @route    /items/:itemId/reject
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - itemId: MongoId (required)
 *
 * @body (ضروری)
 * - feedbackText: string (required)
 *
 * @rules (قواعد)
 * - اگر itemId معتبر نبود:
 *   400 { message: "Invalid itemId" }
 * - اگر feedbackText خالی بود:
 *   400 { message: "feedbackText is required" }
 * - اگر آیتم پیدا نشد:
 *   404 { message: "Item not found" }
 * - فقط آیتم‌های under_review قابل reject هستند:
 *   400 { message: "Only under_review items can be rejected" }
 *
 * @side effects (کارهای جانبی)
 * 1) item.status => "rejected"
 * 2) ثبت rejectFeedback:
 *    item.rejectFeedback = { message: text, by: adminId, at: Date }
 * 3) ثبت در reviewHistory:
 *    { action:"rejected", message:text, by: adminId, at: Date }
 * 4) ایجاد notification برای سازنده آیتم (createdBy):
 *    type: "item_rejected"
 *    payload: { courseId, itemId, feedbackText }
 * 5) اگر دیگر آیتم under_review در همان course نبود و course published بود:
 *    => course.needsReReview = false
 *
 * @example
 * POST /admin/items/65f...999/reject
 * body:
 *   { "feedbackText": "لینک ویدیو خراب است، لطفاً درستش کن." }
 *
 * @response 200
 * {
 *   "message": "Item rejected with feedback",
 *   "item": { "id": "...", "status": "rejected" }
 * }
 *
 * @common errors
 * - 400 / 404 طبق بالا
 * - 401 / 403
 */
router.post("/items/:itemId/reject", auth, requireRoles(["admin"]), rejectItem);

module.exports = router;
