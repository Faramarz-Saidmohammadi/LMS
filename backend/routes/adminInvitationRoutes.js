// const router = require("express").Router();
// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");
// const { emailAdminLimiter } = require("../middleware/emailRateLimit");

// const { createInvitation } = require("../controllers/invitationController");

// router.post("/", auth, requireRoles(["admin"]), emailAdminLimiter, createInvitation);

// module.exports = router;
/**
 * Admin Invitation Routes (مسیرهای دعوت‌نامه ادمین) (Admin Invitations Routes)
 * ------------------------------------------------------------------------------------
 * این فایل فقط یک endpoint دارد: ساخت و ارسال دعوت‌نامه به ایمیل
 *
 * ✅ Endpoint
 * - POST /
 *
 * ✅ هدف (Purpose)
 * - ادمین یک ایمیل را دعوت می‌کند تا به سیستم به عنوان "collaborator" اضافه شود.
 * - سیستم یک token خام می‌سازد، hash آن را در دیتابیس ذخیره می‌کند،
 *   و لینک پذیرش دعوت‌نامه را به ایمیل می‌فرستد.
 *
 * ✅ امنیت (Security)
 * - این endpoint محافظت شده است:
 *   - auth: نیاز به JWT معتبر دارد
 *   - requireRoles(["admin"]): فقط نقش admin اجازه دارد
 * - همچنین rate limit دارد تا ادمین نتواند اسپم ایمیل بفرستد:
 *   - emailAdminLimiter: حداکثر 30 درخواست در هر 1 ساعت
 *
 * ------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * این router معمولاً زیر یک مسیر مثل این mount می‌شود:
 *   app.use("/admin/invitations", router)
 *
 * پس endpoint نهایی می‌شود:
 *   POST /admin/invitations
 */

const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const { emailAdminLimiter } = require("../middleware/emailRateLimit");

const { createInvitation } = require("../controllers/invitationController");

/**
 * ------------------------------------------------------------------------------------
 * ✅ Create Invitation (ساخت و ارسال دعوت‌نامه) (Create Invitation)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /
 * @access   Private (Admin)
 *
 * @middlewares order (ترتیب مهم است)
 * 1) auth
 *    - token از Cookie یا Authorization header خوانده می‌شود
 *    - اگر token نبود/منقضی/نامعتبر => 401
 *    - اگر ok => req.user = { userId, roles }
 *
 * 2) requireRoles(["admin"])
 *    - اگر نقش admin نبود => 403
 *
 * 3) emailAdminLimiter
 *    - rate limit برای ارسال ایمیل دعوت‌نامه
 *    - windowMs: 60 دقیقه
 *    - max: 30 درخواست
 *    - اگر از حد گذشت => 429 Too Many Requests با پیام:
 *      { message: "Too many invitation emails. Try again later." }
 *
 * ------------------------------------------------------------------
 * @request body
 * - email: string (required)
 *
 * @example
 * POST /admin/invitations
 * body:
 *   { "email": "user@example.com" }
 *
 * ------------------------------------------------------------------
 * @behavior (کاری که controller انجام می‌دهد)
 * - email را trim + lowercase می‌کند
 * - اگر یوزر با این ایمیل از قبل وجود داشته باشد:
 *   => 409 { message: "User already exists with this email" }
 * - اگر invitation فعال (pending و هنوز expire نشده) موجود باشد:
 *   => 409 { message: "An active invitation already exists for this email" }
 * - اگر نه:
 *   - rawToken تصادفی می‌سازد (برای لینک)
 *   - tokenHash = sha256(rawToken) ذخیره می‌شود (raw token ذخیره نمی‌شود)
 *   - expiresAt = 7 روز بعد
 *   - Invitation رکورد در DB ایجاد می‌شود
 *   - acceptLink ساخته می‌شود:
 *     اگر CLIENT_URL باشد:
 *       `${CLIENT_URL}/accept-invitation?token=${rawToken}`
 *     اگر CLIENT_URL نباشد:
 *       فقط token داخل متن ایمیل نوشته می‌شود (TOKEN: ...)
 *   - ایمیل ارسال می‌شود
 *
 * ------------------------------------------------------------------
 * @success response 201
 * {
 *   "message": "Invitation sent",
 *   "invitation": {
 *     "id": "...",
 *     "email": "user@example.com",
 *     "role": "collaborator",
 *     "status": "pending",
 *     "expiresAt": "..."
 *   }
 * }
 *
 * ------------------------------------------------------------------
 * @possible errors (خیلی مهم برای فرانت)
 * - 400 { message: "email is required" }
 * - 401 { message: "Unauthorized (token missing|token expired|invalid token)" }
 * - 403 { message: "Forbidden (insufficient role)", required: ["admin"] }
 * - 409 { message: "User already exists with this email" }
 * - 409 { message: "An active invitation already exists for this email" }
 * - 429 { message: "Too many invitation emails. Try again later." }
 * - 500/502/... (SMTP or server error) => از طریق next(err) مدیریت می‌شود
 */
router.post("/", auth, requireRoles(["admin"]), emailAdminLimiter, createInvitation);

module.exports = router;
