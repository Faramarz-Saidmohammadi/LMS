const mongoose = require("mongoose");
const Course = require("../models/Course");
const CurriculumItem = require("../models/CurriculumItem");
const { createNotification } = require("../utils/notify");

// GET /admin/courses/:courseId/items?status=under_review
const getCourseItems = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const filter = { courseId };
    if (status) filter.status = status;

    const items = await CurriculumItem.find(filter)
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

// POST /admin/items/:itemId/approve
const approveItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const item = await CurriculumItem.findById(itemId).select(
      "status courseId title createdBy rejectFeedback reviewHistory"
    );
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.status !== "under_review") {
      return res.status(400).json({ message: "Only under_review items can be approved" });
    }

    item.status = "approved";
    item.rejectFeedback = { message: "", by: null, at: null };

    item.reviewHistory.push({
      action: "approved",
      message: "",
      by: req.user.userId,
      at: new Date(),
    });

    await item.save();

    // ✅ notify collaborator (creator)
    await createNotification({
      userId: item.createdBy,
      type: "item_approved",
      title: "Item Approved",
      message: `Your item "${item.title}" has been approved.`,
      payload: { courseId: item.courseId, itemId: item._id },
    });

    // اگر دیگه آیتم تحت بررسی نبود، needsReReview را خاموش کن
    const pending = await CurriculumItem.countDocuments({
      courseId: item.courseId,
      status: "under_review",
    });

    if (pending === 0) {
      const course = await Course.findById(item.courseId).select("needsReReview status");
      if (course && course.status === "published") {
        course.needsReReview = false;
        await course.save();
      }
    }

    return res.status(200).json({
      message: "Item approved",
      item: { id: item._id, status: item.status },
    });
  } catch (err) {
    next(err);
  }
};

// POST /admin/items/:itemId/reject  { feedbackText }
const rejectItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { feedbackText } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const text = String(feedbackText || "").trim();
    if (!text) return res.status(400).json({ message: "feedbackText is required" });

    const item = await CurriculumItem.findById(itemId).select(
      "status courseId title createdBy rejectFeedback reviewHistory"
    );
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.status !== "under_review") {
      return res.status(400).json({ message: "Only under_review items can be rejected" });
    }

    item.status = "rejected";
    item.rejectFeedback = { message: text, by: req.user.userId, at: new Date() };

    item.reviewHistory.push({
      action: "rejected",
      message: text,
      by: req.user.userId,
      at: new Date(),
    });

    await item.save();

    // ✅ notify collaborator (creator)
    await createNotification({
      userId: item.createdBy,
      type: "item_rejected",
      title: "Item Rejected",
      message: `Your item "${item.title}" was rejected: ${text}`,
      payload: { courseId: item.courseId, itemId: item._id, feedbackText: text },
    });

    // اگر دیگه آیتم تحت بررسی نبود، needsReReview را خاموش کن
    const pending = await CurriculumItem.countDocuments({
      courseId: item.courseId,
      status: "under_review",
    });

    if (pending === 0) {
      const course = await Course.findById(item.courseId).select("needsReReview status");
      if (course && course.status === "published") {
        course.needsReReview = false;
        await course.save();
      }
    }

    return res.status(200).json({
      message: "Item rejected with feedback",
      item: { id: item._id, status: item.status },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCourseItems,
  approveItem,
  rejectItem,
};
