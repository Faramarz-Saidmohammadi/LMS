// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const { createChangeRequest } = require("../controllers/collabChangeRequestController");

// // POST /collab/courses/:id/change-request
// router.post("/courses/:id/change-request", auth, requireRoles(["collaborator", "admin"]), createChangeRequest);

// module.exports = router;
/**
 * Collaborator Change Request Routes (مسیرهای درخواست تغییر برای کورس) (Collab Change Request Routes)
 * -------------------------------------------------------------------------------------------------
 * این فایل مخصوص "collaborator" است تا روی کورس‌های PUBLISHED خودش درخواست تغییر بسازد،
 * چون کورس منتشر شده مستقیم ویرایش نمی‌شود و باید admin بررسی/approve کند.
 *
 * ✅ Endpoint های این فایل:
 *  - POST /collab/courses/:id/change-request
 *
 * -------------------------------------------------------------------------------------------------
 * 🔐 Security / Access (امنیت و دسترسی)
 * - auth (JWT) لازم است
 * - requireRoles(["collaborator", "admin"]) لازم است
 *
 * ⚠️ نکته مهم:
 * - داخل controller فقط کورس‌هایی را اجازه می‌دهد که instructorId == req.user.userId باشد.
 * - یعنی اگر admin این endpoint را بزند ولی instructor همان کورس نباشد، 404 می‌گیرد.
 *   پس عملاً این مسیر برای collaborator ساخته شده، admin فقط در requireRoles اضافه شده.
 *
 * -------------------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر این مسیر mount می‌شود:
 *   app.use("/collab", router)
 *
 * پس endpoint نهایی می‌شود:
 *   POST /collab/courses/:id/change-request
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const { createChangeRequest } = require("../controllers/collabChangeRequestController");

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ Create Change Request (ساخت درخواست تغییر) (Create Course Change Request)
 * -------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /courses/:id/change-request
 * @access   Private (collaborator|admin)  (ولی در عمل: فقط صاحب کورس)
 * @middlewares
 *   - auth
 *   - requireRoles(["collaborator","admin"])
 *
 * @params
 * - id: courseId (MongoId string)
 *
 * @body (required)
 * {
 *   "type": "course_details" | "curriculum_add" | "curriculum_update",
 *   "payload": any
 * }
 *
 * -------------------------------------------------------------------------------------------------
 * ✅ قوانین بسیار مهم (Rules / Business Logic)
 * 1) فقط کورس‌های منتشر شده (published) اجازه change-request دارند
 * 2) فقط صاحب کورس (instructorId == collaboratorId) می‌تواند درخواست بسازد
 * 3) درخواست‌ها همیشه با status="pending" ساخته می‌شود تا admin بعداً تصمیم بگیرد
 *
 * -------------------------------------------------------------------------------------------------
 * 🧩 Request Types (نوع درخواست‌ها) + Payload Contract
 *
 * 1) type = "course_details"
 *    هدف: تغییر اطلاعات اصلی کورس (جزئیات کورس)
 *    فقط همین فیلدها اجازه تغییر دارند:
 *      ["title","shortDesc","startDate","duration","category"]
 *
 *    ✅ payload نمونه:
 *    {
 *      "title": "New Title",
 *      "shortDesc": "Short description ...",
 *      "duration": "6 weeks",
 *      "category": "65f...."   // category id
 *    }
 *
 *    خطاهای مهم:
 *    - اگر هیچ فیلد معتبر نفرستی => 400 { message: "No valid course fields provided for update" }
 *
 * -----------------------------------------------------------------------------------------------
 *
 * 2) type = "curriculum_add"
 *    هدف: اضافه کردن آیتم جدید به یک سِکشن از کورس
 *
 *    ✅ payload شکل دقیق:
 *    {
 *      "sectionId": "<sectionMongoId>",
 *      "item": {
 *        "type": "article" | "video" | "quiz" | "attachment",
 *        "title": "Item title",
 *        "order": 1, // optional
 *
 *        // اگر type=article:
 *        "contentHtml": "<p>...</p>", // optional
 *        "contentJson": {...},        // optional
 *
 *        // اگر type=video:
 *        "youtubeUrl": "https://youtu.be/....", // optional
 *        "videoLengthMinutes": 12,              // optional
 *        "isUnlistedDeclared": true,            // optional
 *        "notesForAdminUpload": "..."           // optional
 *
 *        // اگر type=quiz:
 *        "quiz": { "questions": [...], "totalScore": 100 } // optional
 *
 *        // اگر type=attachment:
 *        "fileUrl": "https://..." // optional
 *      }
 *    }
 *
 *    اعتبارسنجی (Validation):
 *    - sectionId حداقل 10 کاراکتر
 *    - title حداقل 2 و حداکثر 120
 *    - type باید یکی از موارد بالا باشد
 *    - سپس سیستم چک می‌کند section متعلق به همان course باشد
 *
 *    خطاهای مهم:
 *    - 400 { message: "Invalid curriculum_add payload", errors: [...] }
 *    - 400 { message: "Section not found for this course" }
 *
 * -----------------------------------------------------------------------------------------------
 *
 * 3) type = "curriculum_update"
 *    هدف: درخواست آپدیت کردن یک آیتم موجود
 *
 *    ✅ payload شکل دقیق:
 *    {
 *      "itemId": "<itemMongoId>",
 *      "updates": { ... } // هر چیزی (passthrough) ولی با محدودیت‌های ممنوع
 *    }
 *
 *    محدودیت‌های ممنوع (Forbidden keys):
 *    این‌ها را اصلاً اجازه نداری تغییر بدی:
 *      ["_id","courseId","sectionId","status","createdBy","deleted","isDeleted"]
 *    اگر یکی از این‌ها را بفرستی => 400:
 *      { message: "You cannot change field: status" } (مثلاً)
 *
 *    خطاهای مهم:
 *    - 400 { message: "Invalid curriculum_update payload", errors: [...] }
 *    - 400 { message: "Curriculum item not found for this course" }
 *
 * -------------------------------------------------------------------------------------------------
 * ✅ Success Response 201
 * {
 *   "message": "Change request created",
 *   "changeRequest": {
 *     "id": "...",
 *     "status": "pending",
 *     "type": "course_details|curriculum_add|curriculum_update",
 *     "createdAt": "..."
 *   }
 * }
 *
 * -------------------------------------------------------------------------------------------------
 * ✅ Error Responses (برای فرانت خیلی مهم)
 * - 401 Unauthorized (token missing|expired|invalid)
 * - 403 Forbidden (insufficient role)
 * - 404 { message: "Course not found" }  (اگر کورس مال این collaborator نبود یا وجود نداشت)
 * - 400 { message: "Change Request only allowed for published courses. Current status: ..." }
 * - 400 { message: "Validation error", errors: [...] } (type/payload اصلی)
 * - 400 { message: "Invalid curriculum_add payload", errors: [...] }
 * - 400 { message: "Invalid curriculum_update payload", errors: [...] }
 * - 400 { message: "You cannot change field: <field>" }
 */
router.post(
  "/courses/:id/change-request",
  auth,
  requireRoles(["collaborator", "admin"]),
  createChangeRequest
);

module.exports = router;
