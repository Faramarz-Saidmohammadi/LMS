// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");
// const requireCourseOwner = require("../middleware/requireCourseOwner");

// const {
//   createSection,
//   getCurriculum,
//   createItem,
//   updateItem,
//   deleteItem,
//   createArticleItem,
//   updateArticleItem,
// } = require("../controllers/curriculumController");

// // ✅ Sections
// router.post(
//   "/:courseId/sections",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   createSection
// );

// // ✅ Get curriculum
// router.get(
//   "/:courseId/curriculum",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   getCurriculum
// );

// // ✅ Generic items (article/video/quiz/attachment)
// router.post(
//   "/:courseId/sections/:sectionId/items",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   createItem
// );

// router.patch(
//   "/:courseId/items/:itemId",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   updateItem
// );

// router.delete(
//   "/:courseId/items/:itemId",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   deleteItem
// );

// // ✅ Article (Rich Text) explicit endpoints
// router.post(
//   "/:courseId/sections/:sectionId/articles",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   createArticleItem
// );

// router.patch(
//   "/:courseId/articles/:itemId",
//   auth,
//   requireRoles(["collaborator", "admin"]),
//   requireCourseOwner,
//   updateArticleItem
// );

// module.exports = router;
/**
 * Curriculum Routes (مسیـرهای سرفصل/محتوای کورس) (Curriculum Routes)
 * -------------------------------------------------------------------------------------------------
 * این فایل برای کولابراتور/ادمین اجازه می‌دهد که:
 * ✅ Section بسازد
 * ✅ Curriculum کامل یک کورس را بگیرد (sections + items)
 * ✅ Item های مختلف (article/video/quiz/attachment) را CRUD کند
 * ✅ برای Article (Rich Text) دو endpoint جداگانه و واضح هم دارد
 *
 * -------------------------------------------------------------------------------------------------
 * 🔐 Security & Ownership (امنیت و مالکیت)
 * تمام مسیرهای این فایل:
 * - auth: JWT لازم است
 * - requireRoles(["collaborator","admin"]): فقط کولابراتور و ادمین
 * - requireCourseOwner: بررسی می‌کند کورس مال همین کاربر است (یا کاربر admin باشد)
 *
 * ✅ requireCourseOwner چی کار می‌کند؟
 * - courseId را از req.params.courseId (یا req.body.courseId) می‌گیرد
 * - اگر courseId معتبر نبود => 400
 * - اگر کورس پیدا نشد => 404
 * - اگر user admin بود => اجازه
 * - اگر user admin نبود و instructorId != req.user.userId => 403
 * - در آخر req.course = { instructorId, status } را ست می‌کند برای استفاده احتمالی
 *
 * -------------------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر یکی از این مسیرها mount می‌شود:
 * - app.use("/collab/curriculum", router)
 * - یا app.use("/collab/courses", router)
 *
 * اینجا روت‌ها را "نسبت به mount" توضیح می‌دهم.
 *
 * -------------------------------------------------------------------------------------------------
 * 🧠 نکته مهم برای فرانت:
 * - اگر کورس "published" باشد: ساخت/تغییر آیتم‌ها باعث می‌شود item برود under_review و course.needsReReview=true شود
 *   (یعنی تغییرات در کورس منتشرشده باید دوباره توسط admin بررسی شود)
 * - اگر item خودش under_review باشد: ادیت آن ممنوع است
 */

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");
const requireCourseOwner = require("../middleware/requireCourseOwner");

const {
  createSection,
  getCurriculum,
  createItem,
  updateItem,
  deleteItem,
  createArticleItem,
  updateArticleItem,
} = require("../controllers/curriculumController");

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 1) Create Section (ساخت سکشن جدید) (Create Course Section)
 * -------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /:courseId/sections
 * @access   Private (collaborator|admin) + owner required
 *
 * @params
 * - courseId: MongoId
 *
 * @body
 * {
 *   "title": "Section 1 - Introduction", // required
 *   "order": 1                           // optional (default 0)
 * }
 *
 * @behavior (منطق controller)
 * - title اجباری است
 * - یک CourseSection با courseId/title/order ساخته می‌شود
 * - سپس وضعیت کورس بررسی می‌شود:
 *   - اگر course.status === "published":
 *       course.needsReReview = true  (کورس draft نمی‌شود، فقط نیاز به بررسی مجدد علامت می‌خورد)
 *   - اگر course.status === "approved":
 *       course.status = "draft"
 *       course.needsReReview = true
 *       course.isLocked = false
 *
 * @success 201
 * { "message": "Section created", "section": { ... } }
 *
 * @errors
 * - 400 Missing courseId / Invalid courseId
 * - 404 Course not found
 * - 403 Forbidden (not your course)
 * - 400 title is required
 */
router.post(
  "/:courseId/sections",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  createSection
);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 2) Get Curriculum (گرفتن کل سرفصل کورس) (Get Full Curriculum)
 * -------------------------------------------------------------------------------------------------
 * @method   GET
 * @route    /:courseId/curriculum
 * @access   Private (collaborator|admin) + owner required
 *
 * @params
 * - courseId: MongoId
 *
 * @behavior
 * - sections را می‌آورد: sort by (order, createdAt)
 * - items را می‌آورد: sort by (sectionId, order, createdAt)
 *
 * @success 200
 * {
 *   "sections": [ ... ],
 *   "items": [ ... ]
 * }
 *
 * @front usage tip
 * - برای صفحه Course Builder / Curriculum Editor این endpoint اصلی است
 * - بعد از هر create/update/delete بهتر است دوباره همین را refetch کنی (یا optimistic update)
 */
router.get(
  "/:courseId/curriculum",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  getCurriculum
);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 3) Create Generic Item (ساخت آیتم عمومی) (Create Item: article/video/quiz/attachment)
 * -------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /:courseId/sections/:sectionId/items
 * @access   Private (collaborator|admin) + owner required
 *
 * @params
 * - courseId: MongoId
 * - sectionId: MongoId
 *
 * @body (shape)
 * {
 *   "type": "article" | "video" | "quiz" | "attachment", // required
 *   "title": "string",                                   // required
 *   "order": 0,                                          // optional
 *   "content": { ... }                                   // optional but type-dependent
 * }
 *
 * @content rules by type
 * - article:
 *   content.articleHtml (string) OR content.articleJson (any)  یکی‌ش لازم است
 *   اگر خیلی بزرگ باشد => 413
 *
 * - video:
 *   content.youtubeUrl (required)
 *   content.isUnlistedDeclared باید true باشد (اجباری)
 *   content.videoLengthMinutes (optional) ولی اگر > 15 => 400
 *   content.notesForAdminUpload (optional, max 800 chars)
 *   ✅ سیستم youtubeVideoId (11 chars) را از URL استخراج می‌کند و URL را normalize می‌کند
 *
 * - quiz:
 *   content.quiz.questions باید array باشد (اگر نبود => [])
 *
 * - attachment:
 *   content.attachmentUrl / content.attachmentName صرفاً trim می‌شود
 *   (⚠️ در createItem فعلاً attachmentUrl اجباری نشده؛ اگر می‌خواهی اجباری باشد باید چک اضافه کنی)
 *
 * @status behavior
 * - آیتم همیشه اول status="draft" ساخته می‌شود
 * - اگر کورس published باشد:
 *   item.status => "under_review"
 *   course.needsReReview => true
 *
 * @success 201
 * { "message": "Item created", "item": { ... } }
 *
 * @errors
 * - 400 type and title are required
 * - 400 Invalid type
 * - 400 Invalid sectionId
 * - 404 Section not found
 * - 413 content too large (articleHtml/articleJson)
 * - 400 video validation errors
 */
router.post(
  "/:courseId/sections/:sectionId/items",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  createItem
);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 4) Update Item (آپدیت آیتم) (Update Any Item)
 * -------------------------------------------------------------------------------------------------
 * @method   PATCH
 * @route    /:courseId/items/:itemId
 * @access   Private (collaborator|admin) + owner required
 *
 * @params
 * - courseId: MongoId
 * - itemId: MongoId
 *
 * @body (optional)
 * {
 *   "title": "string?",
 *   "order": number?,
 *   "content": { ... }   // type-dependent (مثل create)
 * }
 *
 * @rules
 * - اگر item.status === "under_review" => ادیت ممنوع (400)
 * - article:
 *   content.articleHtml و content.articleJson جداگانه قابل آپدیت است (هر کدام optional)
 * - video:
 *   دوباره validate می‌شود (youtubeUrl + isUnlistedDeclared + length<=15 و استخراج videoId)
 * - quiz:
 *   فقط questions
 * - attachment:
 *   attachmentUrl / attachmentName
 *
 * @published course behavior
 * - اگر کورس published باشد و هر تغییری بدهی:
 *   item.status => "under_review"
 *   course.needsReReview => true
 *
 * @success 200
 * { "message": "Item updated", "item": { ... } }
 *
 * @errors
 * - 400 Invalid itemId
 * - 404 Item not found
 * - 400 Item is under review...
 * - 413 large content
 * - 400 video invalid
 */
router.patch(
  "/:courseId/items/:itemId",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  updateItem
);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 5) Delete Item (حذف آیتم) (Delete Item)
 * -------------------------------------------------------------------------------------------------
 * @method   DELETE
 * @route    /:courseId/items/:itemId
 * @access   Private (collaborator|admin) + owner required
 *
 * @rules
 * - اگر item.status === "approved" => حذف ممنوع (400)
 * - در غیر آن => حذف می‌شود
 *
 * ⚠️ نکته:
 * - در deleteItem برای under_review محدودیت نگذاشتی (فعلاً می‌شود حذف کرد اگر approved نباشد)
 *   اگر می‌خواهی آیتم under_review هم حذف نشود، باید شرط اضافه کنی.
 *
 * @success 200
 * { "message": "Item deleted" }
 *
 * @errors
 * - 404 Item not found
 * - 400 Approved item cannot be deleted
 */
router.delete(
  "/:courseId/items/:itemId",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  deleteItem
);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 6) Create Article Item (ساخت مقاله Rich Text) (Create Article - Explicit)
 * -------------------------------------------------------------------------------------------------
 * @method   POST
 * @route    /:courseId/sections/:sectionId/articles
 * @access   Private (collaborator|admin) + owner required
 *
 * @body
 * {
 *   "title": "string",          // required
 *   "order": 0,                 // optional
 *   "contentHtml": "<p>..</p>", // optional
 *   "contentJson": {...}        // optional
 * }
 *
 * @rules
 * - حداقل یکی از contentHtml یا contentJson لازم است
 * - اگر خیلی بزرگ باشد => 413
 * - آیتم با type="article" و status="draft" ساخته می‌شود
 * - اگر کورس published باشد => item به under_review می‌رود و course.needsReReview=true می‌شود
 *
 * @success 201
 * { "message": "Article item created", "item": { ... } }
 */
router.post(
  "/:courseId/sections/:sectionId/articles",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  createArticleItem
);

/**
 * -------------------------------------------------------------------------------------------------
 * ✅ 7) Update Article Item (آپدیت مقاله Rich Text) (Update Article - Explicit)
 * -------------------------------------------------------------------------------------------------
 * @method   PATCH
 * @route    /:courseId/articles/:itemId
 * @access   Private (collaborator|admin) + owner required
 *
 * @body (optional)
 * {
 *   "title": "string?",
 *   "order": number?,
 *   "contentHtml": "string?",
 *   "contentJson": any?
 * }
 *
 * @rules
 * - فقط برای آیتم‌هایی که type="article" است (وگرنه 400)
 * - اگر item.status === "under_review" => ادیت ممنوع
 * - اگر کورس published باشد => item.status="under_review" و course.needsReReview=true
 *
 * @success 200
 * { "message": "Article item updated", "item": { ... } }
 */
router.patch(
  "/:courseId/articles/:itemId",
  auth,
  requireRoles(["collaborator", "admin"]),
  requireCourseOwner,
  updateArticleItem
);

module.exports = router;
