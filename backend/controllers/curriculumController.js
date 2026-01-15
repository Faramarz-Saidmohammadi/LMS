const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseSection = require("../models/CourseSection");
const CurriculumItem = require("../models/CurriculumItem");

// -----------------------------
// Helpers
// -----------------------------
const tooBig = (obj, maxBytes = 250_000) => {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj || {});
  return Buffer.byteLength(s, "utf8") > maxBytes;
};

// ✅ Extract YouTube video ID (11 chars) and normalize URL
const extractYouTubeId = (rawUrl) => {
  try {
    const url = new URL(String(rawUrl || "").trim());

    const host = url.hostname.toLowerCase();
    const allowedHosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];
    if (!allowedHosts.includes(host)) return null;

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (url.pathname.startsWith("/embed/")) {
      const id = url.pathname.split("/embed/")[1]?.split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (url.pathname.startsWith("/shorts/")) {
      const id = url.pathname.split("/shorts/")[1]?.split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    return null;
  } catch (e) {
    return null;
  }
};

const normalizeYouTubeUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

const validateVideoRules = (content = {}) => {
  const youtubeUrl = String(content.youtubeUrl || "").trim();
  const isUnlistedDeclared = Boolean(content.isUnlistedDeclared);

  if (!youtubeUrl) return { ok: false, message: "youtubeUrl is required for video item" };

  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) return { ok: false, message: "Invalid YouTube link (cannot extract videoId)" };

  if (!isUnlistedDeclared) {
    return { ok: false, message: "You must declare the video as Unlisted (isUnlistedDeclared=true)" };
  }

  let videoLengthMinutes = Number(content.videoLengthMinutes || 0);
  if (Number.isNaN(videoLengthMinutes) || videoLengthMinutes < 0) videoLengthMinutes = 0;

  // enforce declared rule only
  if (videoLengthMinutes > 15) {
    return { ok: false, message: "Video length must be 15 minutes or less (declared)" };
  }

  const notesForAdminUpload = String(content.notesForAdminUpload || "").trim();
  if (notesForAdminUpload.length > 800) {
    return { ok: false, message: "notesForAdminUpload is too long (max 800 chars)" };
  }

  return {
    ok: true,
    payload: {
      youtubeUrl: normalizeYouTubeUrl(videoId),
      youtubeVideoId: videoId,
      videoLengthMinutes,
      isUnlistedDeclared: true,
      notesForAdminUpload,
    },
  };
};

// -----------------------------
// Section APIs
// -----------------------------
const createSection = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, order = 0 } = req.body;

    if (!title) return res.status(400).json({ message: "title is required" });

    const section = await CourseSection.create({
      courseId,
      title: String(title).trim(),
      order: Number(order) || 0,
    });

    // ✅ اگر کورس published باشد: کورس را draft نکن، فقط needsReReview true
    // ✅ اگر کورس approved (قبل از publish) باشد: تغییرات => draft + re-review
    const course = await Course.findById(courseId).select("status needsReReview isLocked");
    if (course) {
      if (course.status === "published") {
        course.needsReReview = true;
        await course.save();
      } else if (course.status === "approved") {
        course.needsReReview = true;
        course.status = "draft";
        course.isLocked = false;
        await course.save();
      }
    }

    return res.status(201).json({ message: "Section created", section });
  } catch (err) {
    next(err);
  }
};

const getCurriculum = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const sections = await CourseSection.find({ courseId }).sort({ order: 1, createdAt: 1 });
    const items = await CurriculumItem.find({ courseId }).sort({ sectionId: 1, order: 1, createdAt: 1 });

    return res.status(200).json({ sections, items });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Generic Item APIs (article/video/quiz/attachment)
// -----------------------------
const createItem = async (req, res, next) => {
  try {
    const { courseId, sectionId } = req.params;
    const { type, title, order = 0, content = {} } = req.body;

    if (!type || !title) return res.status(400).json({ message: "type and title are required" });

    const allowedTypes = ["article", "video", "quiz", "attachment"];
    if (!allowedTypes.includes(type)) return res.status(400).json({ message: "Invalid type" });

    if (!mongoose.Types.ObjectId.isValid(sectionId)) return res.status(400).json({ message: "Invalid sectionId" });

    const section = await CourseSection.findOne({ _id: sectionId, courseId });
    if (!section) return res.status(404).json({ message: "Section not found" });

    const payload = {
      articleHtml: "",
      articleJson: null,

      youtubeUrl: "",
      youtubeVideoId: "",
      videoLengthMinutes: 0,
      isUnlistedDeclared: false,
      notesForAdminUpload: "",

      quiz: { questions: [] },

      attachmentUrl: "",
      attachmentName: "",
    };

    if (type === "article") {
      const html = String(content.articleHtml || "").trim();
      const json = content.articleJson ?? null;

      const hasHtml = html.length > 0;
      const hasJson = json !== null && json !== undefined;

      if (!hasHtml && !hasJson) {
        return res.status(400).json({ message: "For article, articleHtml or articleJson is required" });
      }

      if (hasHtml && tooBig(html)) return res.status(413).json({ message: "articleHtml is too large" });
      if (hasJson && tooBig(json)) return res.status(413).json({ message: "articleJson is too large" });

      payload.articleHtml = hasHtml ? html : "";
      payload.articleJson = hasJson ? json : null;
    }

    if (type === "video") {
      const check = validateVideoRules(content);
      if (!check.ok) return res.status(400).json({ message: check.message });

      payload.youtubeUrl = check.payload.youtubeUrl;
      payload.youtubeVideoId = check.payload.youtubeVideoId;
      payload.videoLengthMinutes = check.payload.videoLengthMinutes;
      payload.isUnlistedDeclared = true;
      payload.notesForAdminUpload = check.payload.notesForAdminUpload;
    }

    if (type === "quiz") {
      payload.quiz.questions = Array.isArray(content.quiz?.questions) ? content.quiz.questions : [];
    }

    if (type === "attachment") {
      payload.attachmentUrl = String(content.attachmentUrl || "").trim();
      payload.attachmentName = String(content.attachmentName || "").trim();
    }

    const item = await CurriculumItem.create({
      courseId,
      sectionId,
      type,
      title: String(title).trim(),
      order: Number(order) || 0,
      status: "draft",
      content: payload,
      createdBy: req.user.userId,
    });

    // ✅ Stage 17: اگر کورس published باشد => آیتم جدید خودکار under_review
    const course = await Course.findById(courseId).select("status needsReReview");
    if (course && course.status === "published") {
      item.status = "under_review";
      await item.save();

      course.needsReReview = true;
      await course.save();
    }

    return res.status(201).json({ message: "Item created", item });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { courseId, itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) return res.status(400).json({ message: "Invalid itemId" });

    const item = await CurriculumItem.findOne({ _id: itemId, courseId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.status === "under_review") {
      return res.status(400).json({ message: "Item is under review. You cannot edit now." });
    }

    const { title, order, content } = req.body;
    if (title !== undefined) item.title = String(title).trim();
    if (order !== undefined) item.order = Number(order) || 0;

    if (content !== undefined) {
      if (item.type === "article") {
        if (content.articleHtml !== undefined) {
          const html = String(content.articleHtml || "").trim();
          if (tooBig(html)) return res.status(413).json({ message: "articleHtml is too large" });
          item.content.articleHtml = html;
        }
        if (content.articleJson !== undefined) {
          const json = content.articleJson;
          if (tooBig(json)) return res.status(413).json({ message: "articleJson is too large" });
          item.content.articleJson = json;
        }
      }

      if (item.type === "video") {
        const incoming = {
          youtubeUrl: content.youtubeUrl !== undefined ? content.youtubeUrl : item.content.youtubeUrl,
          videoLengthMinutes:
            content.videoLengthMinutes !== undefined ? content.videoLengthMinutes : item.content.videoLengthMinutes,
          isUnlistedDeclared:
            content.isUnlistedDeclared !== undefined ? content.isUnlistedDeclared : item.content.isUnlistedDeclared,
          notesForAdminUpload:
            content.notesForAdminUpload !== undefined ? content.notesForAdminUpload : item.content.notesForAdminUpload,
        };

        const check = validateVideoRules(incoming);
        if (!check.ok) return res.status(400).json({ message: check.message });

        item.content.youtubeUrl = check.payload.youtubeUrl;
        item.content.youtubeVideoId = check.payload.youtubeVideoId;
        item.content.videoLengthMinutes = check.payload.videoLengthMinutes;
        item.content.isUnlistedDeclared = true;
        item.content.notesForAdminUpload = check.payload.notesForAdminUpload;
      }

      if (item.type === "quiz" && content.quiz?.questions !== undefined) {
        item.content.quiz.questions = Array.isArray(content.quiz.questions) ? content.quiz.questions : [];
      }

      if (item.type === "attachment") {
        if (content.attachmentUrl !== undefined) item.content.attachmentUrl = String(content.attachmentUrl || "").trim();
        if (content.attachmentName !== undefined) item.content.attachmentName = String(content.attachmentName || "").trim();
      }
    }

    // ✅ Stage 17: اگر کورس published باشد => هر تغییر بره under_review
    const course = await Course.findById(courseId).select("status needsReReview");
    if (course && course.status === "published") {
      item.status = "under_review";
      course.needsReReview = true;
      await course.save();
    }

    await item.save();
    return res.status(200).json({ message: "Item updated", item });
  } catch (err) {
    next(err);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { courseId, itemId } = req.params;

    const item = await CurriculumItem.findOne({ _id: itemId, courseId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.status === "approved") {
      return res.status(400).json({ message: "Approved item cannot be deleted" });
    }

    await CurriculumItem.deleteOne({ _id: item._id });
    return res.status(200).json({ message: "Item deleted" });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Article explicit endpoints (Stage 11)
// -----------------------------
const createArticleItem = async (req, res, next) => {
  try {
    const { courseId, sectionId } = req.params;
    const { title, order = 0, contentHtml, contentJson } = req.body;

    if (!title) return res.status(400).json({ message: "title is required" });

    const section = await CourseSection.findOne({ _id: sectionId, courseId });
    if (!section) return res.status(404).json({ message: "Section not found" });

    const hasHtml = String(contentHtml || "").trim().length > 0;
    const hasJson = contentJson !== undefined && contentJson !== null;

    if (!hasHtml && !hasJson) {
      return res.status(400).json({ message: "contentHtml or contentJson is required" });
    }

    if (hasHtml && tooBig(contentHtml)) return res.status(413).json({ message: "contentHtml is too large" });
    if (hasJson && tooBig(contentJson)) return res.status(413).json({ message: "contentJson is too large" });

    const item = await CurriculumItem.create({
      courseId,
      sectionId,
      type: "article",
      title: String(title).trim(),
      order: Number(order) || 0,
      status: "draft",
      content: {
        articleHtml: hasHtml ? String(contentHtml).trim() : "",
        articleJson: hasJson ? contentJson : null,

        youtubeUrl: "",
        youtubeVideoId: "",
        videoLengthMinutes: 0,
        isUnlistedDeclared: false,
        notesForAdminUpload: "",

        quiz: { questions: [] },

        attachmentUrl: "",
        attachmentName: "",
      },
      createdBy: req.user.userId,
    });

    // ✅ Stage 17: published => item under_review
    const course = await Course.findById(courseId).select("status needsReReview");
    if (course && course.status === "published") {
      item.status = "under_review";
      await item.save();

      course.needsReReview = true;
      await course.save();
    }

    return res.status(201).json({ message: "Article item created", item });
  } catch (err) {
    next(err);
  }
};

const updateArticleItem = async (req, res, next) => {
  try {
    const { courseId, itemId } = req.params;
    const { title, order, contentHtml, contentJson } = req.body;

    const item = await CurriculumItem.findOne({ _id: itemId, courseId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.type !== "article") {
      return res.status(400).json({ message: "This endpoint is only for article items" });
    }

    if (item.status === "under_review") {
      return res.status(400).json({ message: "Item is under review. You cannot edit now." });
    }

    if (title !== undefined) item.title = String(title).trim();
    if (order !== undefined) item.order = Number(order) || 0;

    if (contentHtml !== undefined) {
      if (tooBig(contentHtml)) return res.status(413).json({ message: "contentHtml is too large" });
      item.content.articleHtml = String(contentHtml || "").trim();
    }

    if (contentJson !== undefined) {
      if (tooBig(contentJson)) return res.status(413).json({ message: "contentJson is too large" });
      item.content.articleJson = contentJson;
    }

    // ✅ Stage 17: published => under_review
    const course = await Course.findById(courseId).select("status needsReReview");
    if (course && course.status === "published") {
      item.status = "under_review";
      course.needsReReview = true;
      await course.save();
    }

    await item.save();

    return res.status(200).json({ message: "Article item updated", item });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSection,
  getCurriculum,
  createItem,
  updateItem,
  deleteItem,

  createArticleItem,
  updateArticleItem,
};
