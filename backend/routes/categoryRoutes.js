// const router = require("express").Router();
// const {
//   getPublicCategories,
//   getCategoryPublic,
// } = require("../controllers/categoryController");

// // ✅ Public list (فقط active)
// router.get("/", getPublicCategories);

// // ✅ Public single by id or slug (فقط active)
// router.get("/:idOrSlug", getCategoryPublic);

// module.exports = router;
/**
 * Public Categories Routes (مسیرهای عمومی دسته‌بندی‌ها) (Public Category Routes)
 * ------------------------------------------------------------------------------------
 * این فایل فقط مسیرهای PUBLIC مربوط به Category را هندل می‌کند (بدون auth):
 *  1) گرفتن لیست دسته‌بندی‌های فعال (isActive=true)
 *  2) گرفتن یک دسته‌بندی فعال با id یا slug
 *
 * ✅ هدف (Purpose)
 * - فرانت‌اند (یا هر کلاینت) بتواند دسته‌بندی‌های قابل نمایش را بگیرد
 * - فقط دسته‌بندی‌های active نمایش داده می‌شود
 *
 * ------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر مسیر مثل این mount می‌شود:
 *   app.use("/categories", router)
 *
 * پس endpoint ها می‌شود:
 *   GET /categories
 *   GET /categories/:idOrSlug
 */

const router = require("express").Router();
const { getPublicCategories, getCategoryPublic } = require("../controllers/categoryController");

/**
 * ------------------------------------------------------------------------------------
 * ✅ 1) Public Categories List (لیست عمومی دسته‌بندی‌ها) (Get Active Categories)
 * ------------------------------------------------------------------------------------
 * @method   GET
 * @route    /
 * @access   Public
 *
 * @behavior
 * - فقط دسته‌بندی‌های active را برمی‌گرداند: { isActive: true }
 * - فقط این فیلدها را می‌دهد: name, slug, description
 * - sort بر اساس name به صورت صعودی
 *
 * @success 200
 * {
 *   "categories": [
 *     { "_id": "...", "name": "Programming", "slug": "programming", "description": "..." },
 *     ...
 *   ]
 * }
 *
 * @possible errors
 * - 500 (Server error) => next(err)
 */
router.get("/", getPublicCategories);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 2) Public Category Single (یک دسته‌بندی فعال) (Get Single Active Category)
 * ------------------------------------------------------------------------------------
 * @method   GET
 * @route    /:idOrSlug
 * @access   Public
 *
 * @params
 * - idOrSlug: string (required)
 *   - اگر ObjectId معتبر باشد => سرچ با _id
 *   - اگر ObjectId نبود => سرچ با slug (toLowerCase)
 *
 * @examples
 * - GET /categories/65f0c... (id)
 * - GET /categories/programming (slug)
 *
 * @success 200
 * {
 *   "category": { "_id": "...", "name": "...", "slug": "...", "description": "..." }
 * }
 *
 * @errors
 * - 404 { message: "Category not found" }  (اگر پیدا نشد یا inactive بود)
 */
router.get("/:idOrSlug", getCategoryPublic);

module.exports = router;
