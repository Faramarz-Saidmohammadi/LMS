// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const uploadAvatar = require("../middleware/uploadAvatar");

// const { updateProfile, changePassword } = require("../controllers/meController");

// // PATCH /me/profile
// // FormData:
// // - name: string (optional)
// // - avatar: file (optional)
// router.patch("/me/profile", auth, uploadAvatar, updateProfile);

// // PATCH /me/change-password
// // JSON:
// // { currentPassword, newPassword }
// router.patch("/me/change-password", auth, changePassword);

// module.exports = router;
const router = require("express").Router();

const auth = require("../middleware/auth");
const uploadAvatar = require("../middleware/uploadAvatar");

const { updateProfile, changePassword } = require("../controllers/meController");

/**
 * ============================================================================
 * Me Routes (Authenticated User Profile & Security API Contract)
 * ============================================================================
 *
 * PURPOSE:
 * - این فایل همه عملیات مربوط به "اکانت خودِ کاربر" را انجام می‌دهد:
 *   ✅ آپدیت پروفایل (نام + آواتار)
 *   ✅ تغییر پسورد
 *
 * AUTH:
 * - همه مسیرهای این فایل protected هستند و حتماً نیاز به توکن دارند
 * - Middleware: auth
 *   - token را از Cookie (access_token) یا Authorization: Bearer ... می‌گیرد
 *   - req.user = { userId, roles } را set می‌کند
 *
 * BASE PATH (example):
 * - اگر در app.js اینطور mount شود:
 *   app.use("/", meRoutes)
 *   مسیرها دقیقاً همین‌ها می‌شوند:
 *   PATCH /me/profile
 *   PATCH /me/change-password
 *
 * IMPORTANT FOR FRONTEND:
 * - حتماً cookie-based auth داری:
 *   - برای fetch/axios باید credentials را روشن کنی:
 *     axios.defaults.withCredentials = true
 *     یا fetch(..., { credentials: "include" })
 * - درصورت استفاده از Authorization header هم کار می‌کند (Bearer token)
 * ============================================================================
 */

/**
 * ----------------------------------------------------------------------------
 * PATCH /me/profile
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - آپدیت اطلاعات پروفایل کاربر لاگین‌شده
 * - می‌تواند فقط name را تغییر دهد، یا فقط avatar را، یا هر دو
 *
 * AUTH:
 * - Required ✅ (auth middleware)
 *
 * CONTENT TYPE:
 * - multipart/form-data (چون آپلود فایل دارد)
 *
 * FORM DATA FIELDS:
 * - name: string (optional)
 *   - حداقل 2 و حداکثر 60 کاراکتر (طبق Zod در controller)
 *
 * - avatar: file (optional)
 *   - field name MUST be "avatar"
 *   - فقط image/jpeg | image/png | image/webp قبول است
 *   - max size: 2MB
 *
 * MIDDLEWARES:
 * - auth:
 *   - userId را از JWT می‌گیرد
 * - uploadAvatar:
 *   - multer.memoryStorage()
 *   - req.file را در حافظه می‌گذارد (برای Cloudinary upload)
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   {
 *     message: "Profile updated",
 *     user: {
 *       id, name, email, roles,
 *       avatar: { url, publicId },
 *       isEmailVerified
 *     }
 *   }
 *
 * COMMON ERRORS:
 * - 401 Unauthorized:
 *   - token missing/invalid/expired
 *
 * - 400 Validation error:
 *   - name کوتاه/طولانی
 *
 * - 400/500 Upload issues:
 *   - اگر فایل نوعش اشتباه باشد => multer error
 *   - اگر Cloudinary env ناقص باشد => 500 "Cloudinary config missing in .env"
 *
 * FRONTEND EXAMPLE (concept):
 * - FormData بساز:
 *   const fd = new FormData()
 *   fd.append("name", "New Name")
 *   fd.append("avatar", file)
 *
 * - Request:
 *   PATCH /me/profile
 *   Body: fd
 *   withCredentials: true
 */
router.patch("/me/profile", auth, uploadAvatar, updateProfile);

/**
 * ----------------------------------------------------------------------------
 * PATCH /me/change-password
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - تغییر پسورد کاربر لاگین‌شده (Security Endpoint)
 *
 * AUTH:
 * - Required ✅ (auth middleware)
 *
 * CONTENT TYPE:
 * - application/json
 *
 * BODY:
 * - {
 *    currentPassword: string (min 6, max 72),
 *    newPassword: string (min 8, max 72)
 *   }
 *
 * SECURITY RULES (طبق controller):
 * - currentPassword باید درست باشد (bcrypt compare)
 * - newPassword نباید برابر پسورد فعلی باشد
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   { message: "Password changed successfully" }
 *
 * COMMON ERRORS:
 * - 401 Unauthorized:
 *   - token missing/invalid/expired
 *
 * - 400 Validation error:
 *   - currentPassword/newPassword شرایط Zod را پاس نکند
 *
 * - 400 Current password is incorrect:
 *   - پسورد فعلی اشتباه باشد
 *
 * - 400 New password must be different...
 *   - پسورد جدید همان قبلی باشد
 *
 * FRONTEND NOTE:
 * - بعد از تغییر پسورد، بعضی سیستم‌ها session/token را invalidate می‌کنند
 *   - اینجا فعلاً فقط پسورد تغییر می‌کند و logout اجباری نیست
 *   - اگر خواستی امنیتی‌تر باشد، می‌تونیم بعد از changePassword:
 *     - توکن قبلی را با "tokenVersion" بی‌اعتبار کنیم
 *     - یا logout کنیم (clear cookie)
 */
router.patch("/me/change-password", auth, changePassword);

module.exports = router;
