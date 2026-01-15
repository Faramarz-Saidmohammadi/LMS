const Course = require("../models/Course");
const CourseSection = require("../models/CourseSection");
const CurriculumItem = require("../models/CurriculumItem");
const CourseChangeRequest = require("../models/CourseChangeRequest");

// helper: YouTube URL validation (soft)
const isValidYouTubeUrl = (url = "") => {
  const s = String(url || "").trim();
  if (!s) return false;
  const re =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)[A-Za-z0-9_-]{6,}/i;
  return re.test(s);
};

const listChangeRequests = async (req, res, next) => {
  try {
    const status = req.query.status; // pending/approved/rejected
    const courseId = req.query.courseId;

    const filter = {};
    if (status) filter.status = status;
    if (courseId) filter.courseId = courseId;

    const items = await CourseChangeRequest.find(filter)
      .populate("requestedBy", "name email roles")
      .populate("courseId", "title status instructorId")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ changeRequests: items });
  } catch (err) {
    next(err);
  }
};

const approveChangeRequest = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const id = req.params.id;

    const cr = await CourseChangeRequest.findById(id);
    if (!cr) return res.status(404).json({ message: "Change request not found" });

    if (cr.status !== "pending") {
      return res.status(400).json({ message: `Cannot approve request with status: ${cr.status}` });
    }

    const course = await Course.findById(cr.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "published") {
      return res.status(400).json({ message: "Course is not published anymore. Cannot apply change request." });
    }

    // ✅ Apply changes by type
    if (cr.type === "course_details") {
      const allowed = ["title", "shortDesc", "startDate", "duration", "category"];
      for (const k of allowed) {
        if (cr.payload[k] !== undefined) course[k] = cr.payload[k];
      }
      await course.save();
    }

    if (cr.type === "curriculum_add") {
      const { sectionId, item } = cr.payload || {};

      const section = await CourseSection.findOne({ _id: sectionId, courseId: course._id });
      if (!section) return res.status(400).json({ message: "Section not found for this course" });

      // build new item
      const newItem = {
        courseId: course._id,
        sectionId: section._id,
        type: item.type,
        title: item.title,
        order: item.order ?? 9999,

        status: "approved", // چون همین request توسط admin approve شد
      };

      if (item.type === "article") {
        newItem.contentHtml = item.contentHtml || "";
        newItem.contentJson = item.contentJson || null;
        if (!newItem.contentHtml && !newItem.contentJson) {
          return res.status(400).json({ message: "Article content is required" });
        }
      }

      if (item.type === "video") {
        if (!isValidYouTubeUrl(item.youtubeUrl)) {
          return res.status(400).json({ message: "Invalid YouTube URL" });
        }
        newItem.youtubeUrl = item.youtubeUrl;
        newItem.videoLengthMinutes = item.videoLengthMinutes ?? null;
        newItem.isUnlistedDeclared = item.isUnlistedDeclared === true;
        newItem.notesForAdminUpload = item.notesForAdminUpload || "";
      }

      if (item.type === "quiz") {
        newItem.quiz = item.quiz || { questions: [], totalScore: 0 };
      }

      if (item.type === "attachment") {
        if (!item.fileUrl) return res.status(400).json({ message: "fileUrl is required for attachment" });
        newItem.fileUrl = item.fileUrl;
      }

      await CurriculumItem.create(newItem);
    }

    if (cr.type === "curriculum_update") {
      const { itemId, updates } = cr.payload || {};
      const item = await CurriculumItem.findOne({ _id: itemId, courseId: course._id });
      if (!item) return res.status(400).json({ message: "Item not found for this course" });

      // محافظت: نذار status/IDs تغییر کند
      const forbidden = ["_id", "courseId", "sectionId", "status", "createdBy", "deleted", "isDeleted"];
      for (const k of forbidden) {
        if (updates && updates[k] !== undefined) {
          return res.status(400).json({ message: `Forbidden update field: ${k}` });
        }
      }

      // apply allowed updates
      Object.assign(item, updates);

      // اگر ویدیو است و youtubeUrl تغییر کرد validate کن
      if (item.type === "video" && updates?.youtubeUrl !== undefined) {
        if (!isValidYouTubeUrl(item.youtubeUrl)) {
          return res.status(400).json({ message: "Invalid YouTube URL" });
        }
      }

      await item.save();
    }

    // mark approved
    cr.status = "approved";
    cr.reviewedBy = adminId;
    cr.reviewedAt = new Date();
    cr.appliedAt = new Date();
    await cr.save();

    return res.status(200).json({ message: "Change request approved and applied" });
  } catch (err) {
    next(err);
  }
};

const rejectChangeRequest = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const id = req.params.id;

    const feedback = String(req.body.feedback || "").trim();

    const cr = await CourseChangeRequest.findById(id);
    if (!cr) return res.status(404).json({ message: "Change request not found" });

    if (cr.status !== "pending") {
      return res.status(400).json({ message: `Cannot reject request with status: ${cr.status}` });
    }

    cr.status = "rejected";
    cr.adminFeedback = feedback || "Rejected by admin";
    cr.reviewedBy = adminId;
    cr.reviewedAt = new Date();

    await cr.save();

    return res.status(200).json({ message: "Change request rejected" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
};
