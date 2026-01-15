/**
 * مسیرهای مدیریت دسته‌بندی‌ها (Category Admin Routes)
 * ------------------------------------------------------------------
 * این فایل فقط مسیرهای مربوط به ادمین را مدیریت می‌کند.
 * هدف: توسعه‌دهنده (Front/Back) بدون دیدن فایل‌های وابسته هم بفهمد:
 *  - هر مسیر چی کار می‌کند
 *  - چه دسترسی لازم دارد
 *  - چی می‌گیرد و چی پس می‌دهد (Request/Response)
 *  - خطاهای احتمالی چی هستند
 *
 * ✅ وابستگی‌ها (Dependencies)
 * 1) auth middleware (JWT Authentication):
 *    - توکن را از یکی از این دو جا می‌گیرد:
 *      a) Cookie: req.cookies.access_token
 *      b) Header: Authorization: Bearer <token>
 *    - اگر توکن نبود => 401 Unauthorized (token missing)
 *    - اگر JWT_SECRET نبود => 500 Server misconfig
 *    - اگر توکن منقضی بود => 401 Unauthorized (token expired)
 *    - اگر توکن نامعتبر بود => 401 Unauthorized (invalid token)
 *    - اگر موفق بود => req.user را اینطور می‌سازد:
 *      req.user = { userId: decoded.userId, roles: decoded.roles || [] }
 *
 * 2) requireRoles middleware (Role-Based Access Control / RBAC):
 *    - requireRoles(["admin"]) یعنی کاربر باید نقش admin داشته باشد
 *    - نقش‌ها از req.user.roles خوانده می‌شود (که auth ساخته)
 *    - اگر نقش کافی نبود => 403 Forbidden (insufficient role)
 *      و این JSON را برمی‌گرداند:
 *      { message: "Forbidden (insufficient role)", required: ["admin"] }
 *
 * 3) Controllers (categoryController):
 *    - getAllCategoriesAdmin
 *    - createCategory
 *    - updateCategory
 *    - deleteCategory
 *
 * ⚠️ نکته مهم:
 * مسیر پایه (Base URL) بستگی دارد که این router در app.js با چی mount شده.
 * مثال: app.use("/api/admin/categories", router)
 * در آن صورت: GET /api/admin/categories/
 */

const router = require("express").Router();

// احراز هویت (Authentication) — JWT
const auth = require("../middleware/auth");

// کنترل نقش‌ها (RBAC) — تعیین می‌کند کی اجازه دارد
const requireRoles = require("../middleware/requireRoles");

// کنترلرها (Controllers) — منطق اصلی CRUD داخل این‌ها است
const {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

/**
 * ------------------------------------------------------------------
 * ✅ 1) گرفتن لیست همه دسته‌بندی‌ها برای ادمین (Get all categories - Admin)
 * ------------------------------------------------------------------
 * @method   GET
 * @route    /
 * @access   Private (Admin)
 * @middlewares
 *   - auth: نیاز به توکن معتبر دارد و req.user را می‌سازد
 *   - requireRoles(["admin"]): فقط نقش admin اجازه دارد
 *
 * @description (توضیح)
 * - تمام دسته‌بندی‌ها را برمی‌گرداند (معمولاً شامل inactive/hidden هم می‌تواند باشد)
 * - خروجی دقیق (شکل JSON) بسته به پیاده‌سازی controller است
 *
 * @request
 * - Header (اختیاری اگر کوکی داری):
 *   Authorization: Bearer <JWT>
 * - Cookie (اختیاری اگر هدر نداری):
 *   access_token=<JWT>
 *
 * @responses (حالت‌های برگشت)
 * - 200 OK:
 *   معمولاً چیزی شبیه:
 *   { data: [ ...categories ] } یا { categories: [ ... ] }
 * - 401 Unauthorized:
 *   { message: "Unauthorized (token missing|token expired|invalid token)" }
 * - 403 Forbidden:
 *   { message: "Forbidden (insufficient role)", required: ["admin"] }
 */
router.get("/", auth, requireRoles(["admin"]), getAllCategoriesAdmin);

/**
 * ------------------------------------------------------------------
 * ✅ 2) ساخت یک دسته‌بندی جدید (Create category - Admin)
 * ------------------------------------------------------------------
 * @method   POST
 * @route    /
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @description (توضیح)
 * - یک دسته‌بندی جدید ایجاد می‌کند
 *
 * @request body (نمونه/الگو)
 * - دقیق‌ترین فیلدها را controller تعیین می‌کند، اما معمولاً چیزی مثل:
 *   {
 *     "name": "Laptop",
 *     "slug": "laptop",      // اگر در سیستم دارید
 *     "isActive": true       // اگر سیستم فعال/غیرفعال دارد
 *   }
 *
 * @responses
 * - 201 Created یا 200 OK:
 *   معمولاً:
 *   { message: "...", data: createdCategory }
 * - 400 Bad Request:
 *   اگر اعتبارسنجی فیلدها fail شود (Validation)
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.post("/", auth, requireRoles(["admin"]), createCategory);

/**
 * ------------------------------------------------------------------
 * ✅ 3) آپدیت یک دسته‌بندی (Update category - Admin)
 * ------------------------------------------------------------------
 * @method   PATCH
 * @route    /:id
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - id (Category ID):
 *   آیدی دسته‌بندی که باید تغییر کند
 *
 * @request body (نمونه/الگو)
 * - فیلدهایی که می‌خواهی تغییر کند را می‌فرستی، مثل:
 *   {
 *     "name": "Gaming Laptop",
 *     "isActive": true
 *   }
 *
 * @responses
 * - 200 OK:
 *   { message: "...", data: updatedCategory }
 * - 400 Bad Request:
 *   اگر id اشتباه باشد یا داده‌ها معتبر نباشد
 * - 404 Not Found:
 *   اگر دسته‌بندی با این id پیدا نشود
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.patch("/:id", auth, requireRoles(["admin"]), updateCategory);

/**
 * ------------------------------------------------------------------
 * ✅ 4) حذف یک دسته‌بندی (Delete category - Admin)
 * ------------------------------------------------------------------
 * @method   DELETE
 * @route    /:id
 * @access   Private (Admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["admin"])
 *
 * @params
 * - id (Category ID)
 *
 * @description (توضیح)
 * - دسته‌بندی را حذف می‌کند
 * - بسته به منطق سیستم شما ممکن است:
 *   - حذف کامل (Hard Delete) باشد
 *   - یا حذف نرم (Soft Delete) / غیرفعال‌سازی باشد
 *   (این را controller مشخص می‌کند)
 *
 * @responses
 * - 200 OK:
 *   { message: "Deleted successfully" } یا { data: deletedCategory }
 * - 404 Not Found:
 *   اگر مورد پیدا نشود
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.delete("/:id", auth, requireRoles(["admin"]), deleteCategory);

module.exports = router;
