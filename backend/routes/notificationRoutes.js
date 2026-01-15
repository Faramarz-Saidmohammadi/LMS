// const router = require("express").Router();

// const auth = require("../middleware/auth");

// const {
//   getMyNotifications,
//   markNotificationRead,
// } = require("../controllers/notificationController");

// // GET /me/notifications
// router.get("/me/notifications", auth, getMyNotifications);

// // PATCH /me/notifications/:id/read
// router.patch("/me/notifications/:id/read", auth, markNotificationRead);

// module.exports = router;
const router = require("express").Router();

const auth = require("../middleware/auth");

const {
  getMyNotifications,
  markNotificationRead,
} = require("../controllers/notificationController");

/**
 * ============================================================================
 * Notifications Routes (User Inbox / Alerts API Contract)
 * ============================================================================
 *
 * PURPOSE:
 * - مدیریت نوتیفیکیشن‌های کاربر لاگین‌شده:
 *   ✅ لیست نوتیفیکیشن‌ها (با فیلتر و صفحه‌بندی)
 *   ✅ خوانده‌شدن یک نوتیفیکیشن (mark as read)
 *
 * AUTH:
 * - همه مسیرها protected هستند و نیاز به توکن دارند.
 * - Middleware: auth
 *   - token را از Cookie (access_token) یا Authorization: Bearer ... می‌گیرد
 *   - req.user = { userId, roles } را set می‌کند
 *
 * BASE PATH:
 * - اگر فایل در app.js اینطور mount شود:
 *   app.use("/", notificationRoutes)
 *   مسیرهای نهایی همین‌هایی است که پایین نوشته شده:
 *     GET   /me/notifications
 *     PATCH /me/notifications/:id/read
 *
 * FRONTEND NOTE (Cookie Auth):
 * - اگر توکن در cookie ذخیره می‌شود، در فرانت باید credentials روشن باشد:
 *   - axios: { withCredentials: true }
 *   - fetch: { credentials: "include" }
 * ============================================================================
 */

/**
 * ----------------------------------------------------------------------------
 * GET /me/notifications
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - گرفتن لیست نوتیفیکیشن‌های کاربر فعلی (Inbox)
 * - پشتیبانی از:
 *   ✅ فیلتر خوانده/نخوانده
 *   ✅ صفحه‌بندی (pagination)
 *   ✅ شمارش نوتیفیکیشن‌های خوانده‌نشده (unreadCount) برای badge/UI
 *
 * AUTH:
 * - Required ✅ (auth)
 *
 * QUERY PARAMETERS (Optional):
 * - isRead: "true" | "false"
 *   - اگر "true" => فقط خوانده شده‌ها
 *   - اگر "false" => فقط خوانده‌نشده‌ها
 *   - اگر ارسال نشود => همه
 *
 * - page: number (default: 1)
 *   - حداقل 1 در نظر گرفته می‌شود
 *
 * - limit: number (default: 20)
 *   - حداقل 1
 *   - حداکثر 50 (برای جلوگیری از فشار)
 *
 * SORT:
 * - createdAt: -1  (جدیدترین بالا)
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   {
 *     notifications: [ ...Notification ],
 *     page: number,
 *     limit: number,
 *     unreadCount: number
 *   }
 *
 * NOTES FOR FRONTEND UI:
 * - unreadCount را مستقیم برای badge (مثلاً روی bell icon) استفاده کن
 * - برای infinite scroll:
 *   - page را افزایش بده و append کن
 * - برای tab/filter:
 *   - isRead=false => فقط unread
 *   - isRead=true  => فقط read
 *
 * COMMON ERRORS:
 * - 401 Unauthorized:
 *   - token missing/invalid/expired
 */
router.get("/me/notifications", auth, getMyNotifications);

/**
 * ----------------------------------------------------------------------------
 * PATCH /me/notifications/:id/read
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - mark as read کردن یک نوتیفیکیشن مشخص برای کاربر فعلی
 * - فقط خودِ صاحب نوتیفیکیشن اجازه دارد (با userId filter)
 *
 * AUTH:
 * - Required ✅ (auth)
 *
 * PARAMS:
 * - id: string (Mongo ObjectId)
 *
 * BEHAVIOR:
 * - اگر id معتبر نبود => 400
 * - اگر نوتیفیکیشن برای همین userId نبود/پیدا نشد => 404
 * - اگر قبلاً read نشده باشد:
 *   - isRead=true
 *   - readAt=now
 * - اگر قبلاً read بود:
 *   - تغییر خاصی نمی‌دهد (idempotent)
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   {
 *     message: "Notification marked as read",
 *     notification: { ...Notification }
 *   }
 *
 * COMMON ERRORS:
 * - 400 Invalid notification id:
 *   - اگر ObjectId درست نباشد
 *
 * - 404 Notification not found:
 *   - اگر وجود نداشته باشد یا متعلق به این کاربر نباشد
 *
 * - 401 Unauthorized:
 *   - token missing/invalid/expired
 *
 * FRONTEND TIP:
 * - بعد از mark read:
 *   - یا همان notification را در state آپدیت کن (isRead=true)
 *   - یا دوباره GET /me/notifications?isRead=false را refresh کن
 */
router.patch("/me/notifications/:id/read", auth, markNotificationRead);

module.exports = router;
