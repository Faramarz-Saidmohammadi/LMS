const mongoose = require("mongoose");

const Course = require("../models/Course");
const CourseSection = require("../models/CourseSection");
const CurriculumItem = require("../models/CurriculumItem");

// -------- helpers --------
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isNonEmptyString = (v, min = 1) =>
  typeof v === "string" && v.trim().length >= min;

const isValidYouTubeUrl = (url = "") => {
  const s = String(url || "").trim();
  if (!s) return false;

  // supports:
  // - https://www.youtube.com/watch?v=ID
  // - https://youtu.be/ID
  // - https://www.youtube.com/embed/ID
  const re =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)[A-Za-z0-9_-]{6,}/i;
  return re.test(s);
};

const sumQuizScore = (quiz = {}) => {
  // supports structures like:
  // quiz: { questions:[{score:1},...], totalScore: X }
  if (typeof quiz.totalScore === "number" && quiz.totalScore > 0) return quiz.totalScore;

  const qs = Array.isArray(quiz.questions) ? quiz.questions : [];
  let total = 0;
  for (const q of qs) {
    const s = Number(q.score || 0);
    if (Number.isFinite(s) && s > 0) total += s;
  }
  return total;
};

// -------- main validator --------
/**
 * validateCourseForSubmit
 * - checks details are complete
 * - checks curriculum exists
 * - requires at least 1 video item
 * - validates quiz structure and scoring if quiz exists
 *
 * return:
 * { ok: boolean, errors: [{field, message}], warnings: [{field, message}] }
 */
const validateCourseForSubmit = async ({ courseId, instructorId }) => {
  const errors = [];
  const warnings = [];

  if (!isValidObjectId(courseId)) {
    return { ok: false, errors: [{ field: "courseId", message: "Invalid course id" }], warnings: [] };
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    return { ok: false, errors: [{ field: "course", message: "Course not found" }], warnings: [] };
  }

  // ownership (collaborator only their course)
  if (instructorId && String(course.instructorId) !== String(instructorId)) {
    errors.push({ field: "course", message: "You do not own this course" });
  }

  // status rules
  if (course.status === "published") {
    errors.push({ field: "status", message: "Published course cannot be submitted again directly" });
  }

  // -------- details checks --------
  if (!isNonEmptyString(course.title, 3)) {
    errors.push({ field: "title", message: "Title is required (min 3 chars)" });
  }

  if (!isNonEmptyString(course.shortDesc, 10)) {
    errors.push({ field: "shortDesc", message: "Short description is required (min 10 chars)" });
  }

  if (!course.category) {
    errors.push({ field: "category", message: "Category is required" });
  }

  // startDate required (per your workflow)
  if (!course.startDate) {
    errors.push({ field: "startDate", message: "Start date is required" });
  }

  // duration required (can be string or number)
  const durationOk =
    typeof course.duration === "number"
      ? course.duration > 0
      : isNonEmptyString(course.duration, 1);

  if (!durationOk) {
    errors.push({ field: "duration", message: "Duration is required" });
  }

  // -------- curriculum checks --------
  const sections = await CourseSection.find({ courseId: course._id }).sort({ order: 1 }).lean();
  if (!sections.length) {
    errors.push({ field: "curriculum", message: "At least 1 section is required" });
    return { ok: errors.length === 0, errors, warnings }; // early return
  }

  const sectionIds = sections.map((s) => s._id);

  const items = await CurriculumItem.find({ courseId: course._id, sectionId: { $in: sectionIds } })
    .sort({ order: 1 })
    .lean();

  if (!items.length) {
    errors.push({ field: "curriculum", message: "At least 1 curriculum item is required" });
    return { ok: errors.length === 0, errors, warnings };
  }

  // require at least 1 video
  const videoItems = items.filter((it) => it.type === "video");
  if (!videoItems.length) {
    errors.push({ field: "video", message: "At least 1 video item is required" });
  }

  // validate each item depending on type
  for (const it of items) {
    const prefix = `item:${it._id}`;

    if (!isNonEmptyString(it.title, 2)) {
      errors.push({ field: prefix, message: "Item title is required" });
    }

    if (it.type === "article") {
      // accept contentHtml OR contentJson
      const hasHtml = isNonEmptyString(it.contentHtml || "", 20);
      const hasJson = !!it.contentJson; // could be object
      if (!hasHtml && !hasJson) {
        errors.push({ field: prefix, message: "Article content is required (HTML or JSON)" });
      }
    }

    if (it.type === "video") {
      if (!isValidYouTubeUrl(it.youtubeUrl)) {
        errors.push({ field: prefix, message: "Valid YouTube URL is required" });
      }

      // optional: if you are collecting these fields, enforce them
      if (it.isUnlistedDeclared !== true) {
        warnings.push({ field: prefix, message: "Unlisted declaration is not confirmed (admin should verify)" });
      }

      if (it.videoLengthMinutes != null) {
        const mins = Number(it.videoLengthMinutes);
        if (Number.isFinite(mins) && mins > 15) {
          warnings.push({ field: prefix, message: "Video seems longer than 15 minutes (admin should verify)" });
        }
      } else {
        warnings.push({ field: prefix, message: "Video length is missing (admin should verify)" });
      }
    }

    if (it.type === "quiz") {
      const quiz = it.quiz || it; // some projects store quiz fields at top-level
      const questions = Array.isArray(quiz.questions) ? quiz.questions : [];

      if (!questions.length) {
        errors.push({ field: prefix, message: "Quiz must have at least 1 question" });
      } else {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qPrefix = `${prefix}.q${i + 1}`;

          const opts = Array.isArray(q.options) ? q.options : [];
          if (opts.length < 2) {
            errors.push({ field: qPrefix, message: "Each question must have at least 2 options" });
          }

          // correctAnswer could be index or value
          const hasCorrect =
            q.correctAnswer !== undefined && q.correctAnswer !== null && String(q.correctAnswer).length > 0;

          if (!hasCorrect) {
            errors.push({ field: qPrefix, message: "Each question must have a correctAnswer" });
          }
        }
      }

      const totalScore = sumQuizScore(quiz);
      if (!totalScore || totalScore <= 0) {
        errors.push({ field: prefix, message: "Quiz scoring is invalid (total score must be > 0)" });
      }
    }

    if (it.type === "attachment") {
      // accept fileUrl or cloudinary url
      const fileUrl = it.fileUrl || it.url || it.attachmentUrl;
      if (!isNonEmptyString(fileUrl || "", 8)) {
        errors.push({ field: prefix, message: "Attachment file URL is required" });
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
};

module.exports = { validateCourseForSubmit };
