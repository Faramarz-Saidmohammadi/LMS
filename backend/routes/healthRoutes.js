// const router = require("express").Router();
// const mongoose = require("mongoose");

// // GET /health (basic)
// router.get("/", (req, res) => {
//   return res.status(200).json({
//     status: "ok",
//     service: "lms-backend",
//     time: new Date().toISOString(),
//   });
// });

// // GET /health/live (liveness)
// router.get("/live", (req, res) => {
//   return res.status(200).json({
//     status: "live",
//     uptime: process.uptime(),
//     time: new Date().toISOString(),
//   });
// });

// // GET /health/ready (readiness: DB)
// router.get("/ready", (req, res) => {
//   const dbState = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting

//   const dbStatus =
//     dbState === 1 ? "connected" : dbState === 2 ? "connecting" : dbState === 3 ? "disconnecting" : "disconnected";

//   const ok = dbState === 1;

//   const mem = process.memoryUsage();
//   return res.status(ok ? 200 : 503).json({
//     status: ok ? "ready" : "not_ready",
//     db: dbStatus,
//     uptime: process.uptime(),
//     memory: {
//       rss: mem.rss,
//       heapTotal: mem.heapTotal,
//       heapUsed: mem.heapUsed,
//     },
//     version: process.env.APP_VERSION || "dev",
//     time: new Date().toISOString(),
//   });
// });

// module.exports = router;


const router = require("express").Router();
const mongoose = require("mongoose");

/**
 * ============================================================================
 * Health Routes (System Status / Monitoring API Contract)
 * ============================================================================
 *
 * PURPOSE:
 * - این فایل برای مانیتورینگ/چک‌کردن وضعیت سرویس استفاده می‌شود
 * - مناسب برای:
 *   ✅ Load Balancer health check
 *   ✅ Kubernetes liveness/readiness probes
 *   ✅ Uptime monitoring tools (Pingdom, UptimeRobot, etc.)
 *   ✅ Debug سریع برای DevOps و تیم فرانت
 *
 * AUTH:
 * - هیچ Auth لازم ندارد (Public)
 * - چون فقط اطلاعات عمومی و غیرحساس برمی‌گرداند
 *
 * BASE PATH (example):
 * - If mounted as: app.use("/health", router)
 *   then:
 *   GET /health
 *   GET /health/live
 *   GET /health/ready
 *
 * RESPONSE FORMAT:
 * - همیشه JSON
 * - همیشه field `time` دارد (ISO timestamp)
 *
 * IMPORTANT FOR FRONTEND:
 * - فرانت معمولاً فقط برای نمایش وضعیت یا debugging استفاده می‌کند
 * - برای UI status page می‌توانی این سه endpoint را مصرف کنی
 * ============================================================================
 */

/**
 * ----------------------------------------------------------------------------
 * GET /health
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - Basic "is server responding?" check
 * - صرفاً تایید می‌کند API بالا است و پاسخ می‌دهد
 *
 * AUTH:
 * - Public (no token)
 *
 * PARAMS / QUERY / BODY:
 * - none
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   {
 *     status: "ok",
 *     service: "lms-backend",
 *     time: "2026-01-12T....Z"
 *   }
 *
 * FRONTEND/DEVOPS USAGE:
 * - برای چک سریع در مرورگر یا Postman
 * - برای monitoring ساده (HTTP 200 = good)
 */
router.get("/", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "lms-backend",
    time: new Date().toISOString(),
  });
});

/**
 * ----------------------------------------------------------------------------
 * GET /health/live
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - Liveness probe (آیا پروسه Node.js زنده است؟)
 * - این endpoint معمولاً DB را چک نمی‌کند
 * - فقط می‌گوید اپلیکیشن هنوز running است
 *
 * AUTH:
 * - Public
 *
 * PARAMS / QUERY / BODY:
 * - none
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   {
 *     status: "live",
 *     uptime: <seconds>,
 *     time: "ISO"
 *   }
 *
 * NOTES:
 * - uptime مقدار ثانیه‌ای است از زمانی که پروسه شروع شده
 *
 * FRONTEND/DEVOPS USAGE:
 * - Kubernetes livenessProbe
 * - اگر این fail شود یعنی process مشکل جدی دارد/crash loop
 */
router.get("/live", (req, res) => {
  return res.status(200).json({
    status: "live",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

/**
 * ----------------------------------------------------------------------------
 * GET /health/ready
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - Readiness probe (آیا سرویس آماده‌ی سرویس‌دهی واقعی است؟)
 * - اینجا DB connection چک می‌شود
 *
 * AUTH:
 * - Public
 *
 * DB READY STATES:
 * - mongoose.connection.readyState:
 *   0 = disconnected
 *   1 = connected
 *   2 = connecting
 *   3 = disconnecting
 *
 * BEHAVIOR:
 * - اگر DB connected باشد => HTTP 200 + status: "ready"
 * - اگر DB connected نباشد => HTTP 503 + status: "not_ready"
 *
 * PARAMS / QUERY / BODY:
 * - none
 *
 * SUCCESS RESPONSE (DB connected):
 * - 200 OK:
 *   {
 *     status: "ready",
 *     db: "connected",
 *     uptime: <seconds>,
 *     memory: { rss, heapTotal, heapUsed },
 *     version: "dev" | <APP_VERSION>,
 *     time: "ISO"
 *   }
 *
 * FAILURE RESPONSE (DB not connected):
 * - 503 Service Unavailable:
 *   {
 *     status: "not_ready",
 *     db: "disconnected" | "connecting" | "disconnecting",
 *     uptime: <seconds>,
 *     memory: {...},
 *     version: ...,
 *     time: "ISO"
 *   }
 *
 * FRONTEND/DEVOPS USAGE:
 * - Kubernetes readinessProbe
 * - Load Balancer should route traffic only when this returns 200
 *
 * SECURITY NOTE:
 * - memory numbers are not super sensitive, but اگر خواستی production خیلی strict باشد
 *   می‌توانیم memory را حذف کنیم یا behind admin-only قرار بدهیم
 */
router.get("/ready", (req, res) => {
  const dbState = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting

  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : dbState === 3
      ? "disconnecting"
      : "disconnected";

  const ok = dbState === 1;

  const mem = process.memoryUsage();
  return res.status(ok ? 200 : 503).json({
    status: ok ? "ready" : "not_ready",
    db: dbStatus,
    uptime: process.uptime(),
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
    },
    version: process.env.APP_VERSION || "dev",
    time: new Date().toISOString(),
  });
});

module.exports = router;
