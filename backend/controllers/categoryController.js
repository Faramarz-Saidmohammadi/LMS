const mongoose = require("mongoose");
const Category = require("../models/Category");

// slug ساده بدون پکیج
const slugify = (text) =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")     // remove symbols
    .replace(/\s+/g, "-")         // spaces -> -
    .replace(/-+/g, "-");         // multiple - -> single

// ✅ PUBLIC: GET /categories  (فقط active ها)
const getPublicCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("name slug description")
      .sort({ name: 1 });

    return res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
};

// ✅ PUBLIC: GET /categories/:idOrSlug
const getCategoryPublic = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    let category = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      category = await Category.findOne({ _id: idOrSlug, isActive: true }).select(
        "name slug description"
      );
    } else {
      category = await Category.findOne({ slug: String(idOrSlug).toLowerCase(), isActive: true }).select(
        "name slug description"
      );
    }

    if (!category) return res.status(404).json({ message: "Category not found" });

    return res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
};

// ✅ ADMIN: GET /admin/categories (همه: active/inactive)
const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .select("name slug description isActive createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
};

// ✅ ADMIN: POST /admin/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description = "", isActive = true } = req.body;

    if (!name) return res.status(400).json({ message: "name is required" });

    const cleanName = String(name).trim();
    const slug = slugify(cleanName);

    if (!slug) return res.status(400).json({ message: "Invalid category name" });

    const exists = await Category.findOne({
      $or: [{ name: cleanName }, { slug }],
    });

    if (exists) return res.status(409).json({ message: "Category already exists" });

    const category = await Category.create({
      name: cleanName,
      slug,
      description: String(description || "").trim(),
      isActive: Boolean(isActive),
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      message: "Category created",
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ ADMIN: PATCH /admin/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const { name, description, isActive } = req.body;

    if (name !== undefined) {
      const cleanName = String(name).trim();
      const newSlug = slugify(cleanName);

      // چک تکراری
      const exists = await Category.findOne({
        _id: { $ne: category._id },
        $or: [{ name: cleanName }, { slug: newSlug }],
      });

      if (exists) return res.status(409).json({ message: "Another category with same name/slug exists" });

      category.name = cleanName;
      category.slug = newSlug;
    }

    if (description !== undefined) category.description = String(description || "").trim();
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return res.status(200).json({
      message: "Category updated",
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ ADMIN: DELETE /admin/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await Category.deleteOne({ _id: id });

    return res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // public
  getPublicCategories,
  getCategoryPublic,

  // admin
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};
