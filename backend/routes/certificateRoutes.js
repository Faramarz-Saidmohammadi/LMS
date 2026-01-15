// const router = require("express").Router();
// const { z } = require("zod");

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");
// const validate = require("../middleware/validate");

// const {
//   generateCertificate,
//   getMyCertificates,
// } = require("../controllers/certificateController");

// // فقط برای generate هیچ body لازم نیست
// const generateSchema = z.object({
//   params: z.object({
//     id: z.string().min(1),
//   }),
//   body: z.any().optional(),
//   query: z.any().optional(),
// });

// // POST /courses/:id/certificate/generate
// router.post(
//   "/courses/:id/certificate/generate",
//   auth,
//   requireRoles(["student", "admin"]),
//   validate(generateSchema),
//   generateCertificate
// );

// // GET /me/certificates
// router.get("/me/certificates", auth, requireRoles(["student", "admin"]), getMyCertificates);

// module.exports = router;
/**
 * Certificate Routes (مسیرهای سرتیفیکیت) (Certificate API Routes)
 * -------------------------------------------------------------------------------------------------
 * این فایل دو تا کار اصلی می‌کند:
 * 1) ساخت/جنریت کردن سرتیفیکیت PDF برای یک کورس (Generate Certificate)
 * 2) گرفتن لیست سرتیفیکیت‌های خود کاربر لاگین‌شده (My Certificates)
 *
 * ✅ این مسیرها Protected هستند:
 * - auth (JWT) لازم است
 * - role باید یکی از این‌ها باشد: student یا admin
 *
 * چرا admin هم اجازه دارد؟
 * - احتمالاً برای تست/پشتیبانی یا تولید دستی سرتیفیکیت‌ها.
 * - ولی دقت کن: generateCertificate با studentId = req.user.userId کار می‌کند،
 *   یعنی admin هم اگر بزند، سرتیفیکیت برای خود admin ساخته می‌شود (نه برای یک student دیگر).
 *   (اگر خواستی admin برای دیگران بسازد، باید endpoint جدا داشته باشی.)
 *
 * -------------------------------------------------------------------------------------------------
 * 🔐 Security / Access (امنیت و دسترسی)
 *
 * Middlewares:
 * 1) auth:
 *    - Token از Cookie (access_token) یا Authorization: Bearer می‌آید
 *    - خطاها:
 *      401 Unauthorized (token missing|token expired|invalid token)
 *      500 Server misconfig: JWT_SECRET missing
 *    - اگر ok => req.user = { userId, roles }
 *
 * 2) requireRoles(["student","admin"]):
 *    - اگر نقش مناسب نبود => 403 Forbidden (insufficient role)
 *
 * 3) validate(generateSchema):
 *    - با zod، پارامتر route را validate می‌کند (params.id باید string non-empty باشد)
 *    - در صورت خطا => 400 Validation error + لیست errors
 *    - دیتا validate شده در req.validated ذخیره می‌شود
 *      (ولی در controller فعلاً مستقیم از req.params استفاده شده)
 *
 * -------------------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر یک مسیر مثل این mount می‌شود:
 *   app.use("/", router)  یا app.use("/api", router)
 *
 * با توجه به route هایی که نوشتی، endpoint ها دقیقاً این‌هاست:
 *   POST /courses/:id/certificate/generate
 *   GET  /me/certificates
 */

const router = require("express").Router();
const { z } = require("zod");

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const validate = require("../middleware/validate");

const { generateCertificate, getMyCertificates } = require("../controllers/certificateController");

/**
 * generateSchema (اسکیما برای validate) (Zod Schema)
 * -------------------------------------------------------------------------------------------------
 * فقط params.id را چک می‌کند که خالی نباشد.
 * body لازم نیست (پس body را optional گذاشتیم).
 */
const generateSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.any().optional(),
  query: z.any().optional(),
});

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 1) Generate Certificate (ساخت سرتیفیکیت برای کورس) (Generate Certificate PDF)
 * -------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /courses/:id/certificate/generate
 * @access   Private (student|admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["student","admin"])
 *   - validate(generateSchema)
 *
 * @params
 * - id: courseId (string)  ✅ در schema فقط string non-empty است، اما در controller عملاً MongoId است.
 *
 * @body
 * - هیچ چیزی لازم نیست
 *
 * @behavior (منطق controller)
 * - studentId = req.user.userId
 * - enrollment را پیدا می‌کند:
 *   Enrollment.findOne({ courseId, studentId }).select("progressPercent isCompleted completedAt")
 *
 * - شرط اصلی برای جنریت:
 *   isCompleted === true  OR  progressPercent >= 100
 *   اگر کورس کامل نشده باشد => 400 و progressPercent برمی‌گردد
 *
 * - اگر قبلاً certificate ساخته شده باشد و pdfUrl داشته باشد:
 *   => 200 "Certificate already generated" + certificate
 *
 * - اگر certificate نبود:
 *   - course و student را پیدا می‌کند
 *   - یک PDF با pdfkit می‌سازد و در مسیر:
 *     /uploads/certificates/<CERT-...>.pdf ذخیره می‌کند
 *   - pdfUrl را از روی req.protocol و host می‌سازد:
 *     `${req.protocol}://${req.get("host")}/uploads/certificates/${fileName}`
 *   - سپس در DB رکورد Certificate می‌سازد:
 *     { courseId, studentId, certificateNo, issuedAt, pdfUrl, progressSnapshot }
 *
 * @success responses
 * - 201 Created:
 *   {
 *     message: "Certificate generated",
 *     certificate: { ... , pdfUrl, issuedAt, certificateNo, ... }
 *   }
 *
 * - 200 OK (اگر قبلاً ساخته شده بود):
 *   {
 *     message: "Certificate already generated",
 *     certificate: { ... }
 *   }
 *
 * @common errors
 * - 400 Validation error (اگر params.id خالی باشد)
 * - 400 { message: "You are not enrolled in this course" }
 * - 400 { message: "Course is not completed yet...", progressPercent }
 * - 404 { message: "Course not found" }
 * - 404 { message: "Student not found" }
 * - 401 Unauthorized (token missing/expired/invalid)
 * - 403 Forbidden (insufficient role)
 *
 * @special behavior
 * - اگر race condition شود و unique index duplicate بدهد (err.code === 11000):
 *   => 200 "Certificate already generated" + certificate
 *
 * ⚠️ نکته فنی مهم برای فرانت/دیپلوی
 * - pdfUrl بر اساس host فعلی ساخته می‌شود.
 *   اگر پشت reverse proxy/CDN باشی، ممکن است host/protocol درست نباشد.
 *   (اگر خواستی، از ENV BASE_URL استفاده کن.)
 */
router.post(
  "/courses/:id/certificate/generate",
  auth,
  requireRoles(["student", "admin"]),
  validate(generateSchema),
  generateCertificate
);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 2) Get My Certificates (لیست سرتیفیکیت‌های من) (My Certificates)
 * -------------------------------------------------------------------------------------------------
 * @method   GET
 * @route    /me/certificates
 * @access   Private (student|admin)
 * @middlewares
 *   - auth
 *   - requireRoles(["student","admin"])
 *
 * @behavior
 * - studentId = req.user.userId
 * - Certificate.find({ studentId })
 * - populate("courseId", "title")
 * - sort({ issuedAt: -1 })
 *
 * @success 200
 * {
 *   "certificates": [
 *     {
 *       "_id": "...",
 *       "courseId": { "_id": "...", "title": "..." },
 *       "certificateNo": "...",
 *       "issuedAt": "...",
 *       "pdfUrl": "...",
 *       ...
 *     }
 *   ]
 * }
 *
 * @errors
 * - 401 Unauthorized
 * - 403 Forbidden
 */
router.get("/me/certificates", auth, requireRoles(["student", "admin"]), getMyCertificates);

module.exports = router;
