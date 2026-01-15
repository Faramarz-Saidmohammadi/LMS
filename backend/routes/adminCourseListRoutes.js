// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const { listAdminCourses } = require("../controllers/adminCourseListController");

// // GET /admin/courses?status=&search=&page=&limit=&sort=
// // این فایل فقط GET list را هندل می‌کند
// router.get("/", auth, requireRoles(["admin"]), listAdminCourses);

// module.exports = router;
/**
 * Admin Courses List Routes (مسیر لیست کورس‌ها برای ادمین)
 * ----------------------------------------------------------------------
 * این فایل فقط یک کار می‌کند: **لیست کورس‌ها را برای ادمین برمی‌گرداند**
 * با قابلیت:
 *  - فیلتر بر اساس status
 *  - سرچ (search)
 *  - صفحه‌بندی (pagination: page, limit)
 *  - مرتب‌سازی (sort)
 *
 * ✅ این فایل مناسب فرانت/AI است چون بدون دیدن controller هم می‌فهمی:
 *  - چه endpoint داریم
 *  - چه query هایی قبول می‌کند
 *  - چه data برمی‌گرداند (meta + courses)
 *  - چه خطاهایی ممکن است
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
 *    - اگر JWT_SECRET نبود => 500 Server misconfig: JWT_SECRET missing
 *    - اگر token expired بود => 401 Unauthorized (token expired)
 *    - اگر token invalid بود => 401 Unauthorized (invalid token)
 *    - اگر موفق بود => req.user را اینطور می‌سازد:
 *      req.user = { userId: decoded.userId, roles: decoded.roles || [] }
 *
 * 2) requireRoles(["admin"]) (RBAC):
 *    - فقط نقش admin اجازه دارد
 *    - اگر نقش کافی نبود => 403 Forbidden (insufficient role)
 *      { message: "Forbidden (insufficient role)", required: ["admin"] }
 *
 * ----------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * این router معمولاً زیر یک مسیر مثل این mount می‌شود:
 *   app.use("/admin/courses", router)
 * پس endpoint نهایی می‌شود:
 *   GET /admin/courses?status=&search=&page=&limit=&sort=
 *
 * اگر base شما فرق دارد، همین GET نسبت به base حساب می‌شود.
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const { listAdminCourses } = require("../controllers/adminCourseListController");

/**
 * ----------------------------------------------------------------------
 * ✅ List Courses (Admin) — لیست کورس‌ها برای ادمین
 * ----------------------------------------------------------------------
 * @method   GET
 * @route    /
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * ----------------------------------------------------------------------
 * @query params (همه اختیاری)
 *
 * 1) status
 * - فیلتر وضعیت کورس
 * - مقادیر رایج طبق کد controller:
 *   "draft" | "under_review" | "rejected" | "approved" | "published"
 * - اگر نفرستی => همه status ها می‌آید
 *
 * 2) search
 * - سرچ متنی (معمولاً روی title/shortDesc و ... بسته به buildSearchFilter)
 * - اگر خالی باشد => سرچ اعمال نمی‌شود
 *
 * 3) page
 * - شماره صفحه (pagination)
 * - اگر نفرستی => داخل getPagination مقدار پیش‌فرض اعمال می‌شود (معمولاً 1)
 *
 * 4) limit
 * - تعداد آیتم در هر صفحه
 * - اگر نفرستی => پیش‌فرض getPagination اعمال می‌شود
 *
 * 5) sort
 * - نوع مرتب‌سازی
 * - پیش‌فرض: "newest"
 * - مقدارهای دقیق به buildSort بستگی دارد، اما معمولاً چیزهایی مثل:
 *   "newest", "oldest", "updated", "published" ...
 *
 * ----------------------------------------------------------------------
 * @example requests
 * - GET /admin/courses
 * - GET /admin/courses?status=pending   (اگر status شما چنین مقداری ندارد، نتیجۀ خالی می‌دهد)
 * - GET /admin/courses?status=published&page=1&limit=10&sort=newest
 * - GET /admin/courses?search=react&page=2&limit=20
 * - GET /admin/courses?status=under_review&search=javascript&sort=newest
 *
 * ----------------------------------------------------------------------
 * @what this endpoint returns (Response Shape)
 * @response 200 OK
 * {
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 57,
 *     "pages": 6,
 *     ... // دقیقش به buildMeta بستگی دارد
 *   },
 *   "courses": [
 *     {
 *       "_id": "...",
 *       "title": "...",
 *       "shortDesc": "...",
 *       "category": { "_id": "...", "name": "...", "slug": "..." },
 *       "instructorId": { "_id": "...", "name": "...", "email": "...", "roles": [...] },
 *       "status": "published",
 *       "publishedAt": "...",
 *       "createdAt": "...",
 *       "updatedAt": "..."
 *     }
 *   ]
 * }
 *
 * ----------------------------------------------------------------------
 * @implementation notes (مهم برای فرانت/AI)
 * - select شده‌ها (فقط همین فیلدها می‌آید):
 *   "title shortDesc category instructorId status publishedAt createdAt updatedAt"
 * - category populate می‌شود با: "name slug"
 * - instructorId populate می‌شود با: "name email roles"
 * - ترتیب نتایج: sortObj
 * - صفحه‌بندی: skip/limit
 *
 * ----------------------------------------------------------------------
 * @common errors
 * - 401 Unauthorized:
 *   { message: "Unauthorized (token missing|token expired|invalid token)" }
 * - 403 Forbidden:
 *   { message: "Forbidden (insufficient role)", required: ["admin"] }
 *
 * @possible errors (بسته به helpers و mongoose)
 * - 400 Bad Request یا 500 Server Error:
 *   اگر page/limit نامعتبر باشد یا sort value در buildSort خراب مدیریت شده باشد
 */
router.get("/", auth, requireRoles(["admin"]), listAdminCourses);

module.exports = router;


