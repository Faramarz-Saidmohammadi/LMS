const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseSection = require("../models/CourseSection");
const CurriculumItem = require("../models/CurriculumItem");
const QuizAttempt = require("../models/QuizAttempt");

// ---------------------
// Helpers
// ---------------------
const normalizeIndexes = (arr) => {
  const a = Array.isArray(arr) ? arr : [];
  const filtered = a
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 3);

  // unique + sorted
  return Array.from(new Set(filtered)).sort((x, y) => x - y);
};

const validateQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, message: "questions[] is required and cannot be empty" };
  }

  if (questions.length > 200) {
    return { ok: false, message: "Too many questions (max 200)" };
  }

  const normalized = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] || {};

    const questionText = String(q.questionText || "").trim();
    if (!questionText) return { ok: false, message: `Question ${i + 1}: questionText is required` };

    const questionType = q.questionType === "multi" ? "multi" : "single";

    const options = Array.isArray(q.options) ? q.options.map((o) => String(o || "").trim()) : [];
    if (options.length !== 4) return { ok: false, message: `Question ${i + 1}: options must be exactly 4` };
    if (options.some((o) => !o)) return { ok: false, message: `Question ${i + 1}: options cannot be empty` };

    const correct = normalizeIndexes(q.correctAnswerIndexes);

    if (questionType === "single") {
      if (correct.length !== 1) {
        return { ok: false, message: `Question ${i + 1}: single choice must have exactly 1 correctAnswerIndex` };
      }
    } else {
      if (correct.length < 1) {
        return { ok: false, message: `Question ${i + 1}: multi choice must have at least 1 correctAnswerIndex` };
      }
    }

    let score = Number(q.score ?? 1);
    if (Number.isNaN(score) || score < 0) score = 0;

    normalized.push({
      questionText,
      questionType,
      options,
      correctAnswerIndexes: correct,
      score,
    });
  }

  return { ok: true, questions: normalized };
};

const calcScores = (quizQuestions, normalizedAnswers) => {
  let maxScore = 0;
  let totalScore = 0;

  const breakdown = [];

  for (let i = 0; i < quizQuestions.length; i++) {
    const q = quizQuestions[i];
    maxScore += Number(q.score || 0);

    const ans = normalizedAnswers.find((a) => a.questionIndex === i);
    const selected = ans ? ans.selectedIndexes : [];

    const correct = normalizeIndexes(q.correctAnswerIndexes);

    let isCorrect = false;

    if (q.questionType === "single") {
      isCorrect = selected.length === 1 && selected[0] === correct[0];
    } else {
      // strict match (بدون partial score)
      isCorrect =
        selected.length === correct.length &&
        selected.every((v, idx) => v === correct[idx]);
    }

    const earned = isCorrect ? Number(q.score || 0) : 0;
    totalScore += earned;

    breakdown.push({
      questionIndex: i,
      earned,
      max: Number(q.score || 0),
      isCorrect,
    });
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;

  return { totalScore, maxScore, percentage, breakdown };
};

// normalize submission formats:
// accepts
// 1) answers: [{questionIndex, selectedIndexes:[..]}]
// 2) answers: [0,1,2,...] (single-choice simple format)
// 3) answers: [[0,2],[1],...]
const normalizeSubmissionAnswers = (answers) => {
  if (!answers) return [];

  if (Array.isArray(answers) && answers.length > 0) {
    // format 2 or 3
    if (typeof answers[0] === "number" || Array.isArray(answers[0])) {
      return answers.map((a, idx) => ({
        questionIndex: idx,
        selectedIndexes: normalizeIndexes(Array.isArray(a) ? a : [a]),
      }));
    }

    // format 1
    if (typeof answers[0] === "object") {
      return answers
        .map((x) => ({
          questionIndex: Number(x.questionIndex),
          selectedIndexes: normalizeIndexes(x.selectedIndexes),
        }))
        .filter((x) => Number.isInteger(x.questionIndex) && x.questionIndex >= 0);
    }
  }

  return [];
};

// ---------------------
// Collaborator: Create quiz item
// POST /courses/:courseId/sections/:sectionId/quizzes
// ---------------------
const createQuizItem = async (req, res, next) => {
  try {
    const { courseId, sectionId } = req.params;
    const { title, order = 0, questions = [] } = req.body;

    if (!title) return res.status(400).json({ message: "title is required" });

    const section = await CourseSection.findOne({ _id: sectionId, courseId });
    if (!section) return res.status(404).json({ message: "Section not found" });

    const check = validateQuestions(questions);
    if (!check.ok) return res.status(400).json({ message: check.message });

    const item = await CurriculumItem.create({
      courseId,
      sectionId,
      type: "quiz",
      title: String(title).trim(),
      order: Number(order) || 0,
      status: "draft",
      content: {
        articleHtml: "",
        articleJson: null,

        youtubeUrl: "",
        youtubeVideoId: "",
        videoLengthMinutes: 0,
        isUnlistedDeclared: false,
        notesForAdminUpload: "",

        quiz: { questions: check.questions },

        attachmentUrl: "",
        attachmentName: "",
      },
      createdBy: req.user.userId,
    });

    // اگر کورس published باشد، کوییز جدید باید review شود
    const course = await Course.findById(courseId).select("status needsReReview");
    if (course && course.status === "published") {
      item.status = "under_review";
      await item.save();

      course.needsReReview = true;
      await course.save();
    }

    return res.status(201).json({ message: "Quiz item created", item });
  } catch (err) {
    next(err);
  }
};

// ---------------------
// Collaborator: Update quiz item
// PATCH /courses/:courseId/quizzes/:itemId
// ---------------------
const updateQuizItem = async (req, res, next) => {
  try {
    const { courseId, itemId } = req.params;
    const { title, order, questions } = req.body;

    const item = await CurriculumItem.findOne({ _id: itemId, courseId });
    if (!item) return res.status(404).json({ message: "Quiz item not found" });

    if (item.type !== "quiz") return res.status(400).json({ message: "This endpoint is only for quiz items" });

    if (item.status === "under_review") {
      return res.status(400).json({ message: "Quiz is under review. You cannot edit now." });
    }

    if (title !== undefined) item.title = String(title).trim();
    if (order !== undefined) item.order = Number(order) || 0;

    if (questions !== undefined) {
      const check = validateQuestions(questions);
      if (!check.ok) return res.status(400).json({ message: check.message });
      item.content.quiz.questions = check.questions;
    }

    // اگر کورس published باشد => تغییرات باید بره review
    const course = await Course.findById(courseId).select("status needsReReview");
    if (course && course.status === "published") {
      item.status = "under_review";
      course.needsReReview = true;
      await course.save();
    }

    await item.save();

    return res.status(200).json({ message: "Quiz item updated", item });
  } catch (err) {
    next(err);
  }
};

// ---------------------
// Student: Submit quiz
// POST /courses/:courseId/quizzes/:itemId/submit
// Body: { answers: ... }
// ---------------------
const submitQuiz = async (req, res, next) => {
  try {
    const { courseId, itemId } = req.params;
    const studentId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid quiz item id" });
    }

    const quizItem = await CurriculumItem.findOne({ _id: itemId, courseId });
    if (!quizItem) return res.status(404).json({ message: "Quiz not found" });

    if (quizItem.type !== "quiz") {
      return res.status(400).json({ message: "Item is not a quiz" });
    }

    // فقط approved یا published آیتم ها قابل submit باشد
    // (اگر میخوای draft هم برای تست submit شود، این شرط را بردار)
    if (!["approved", "published"].includes(quizItem.status)) {
      return res.status(400).json({ message: "Quiz is not available for students yet" });
    }

    const questions = quizItem.content?.quiz?.questions || [];
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Quiz has no questions" });
    }

    const incomingAnswers = normalizeSubmissionAnswers(req.body.answers);

    // محدودیت ساده: نهایتاً اندازه سوالات
    const normalizedAnswers = incomingAnswers
      .filter((a) => a.questionIndex >= 0 && a.questionIndex < questions.length)
      .map((a) => ({
        questionIndex: a.questionIndex,
        selectedIndexes: normalizeIndexes(a.selectedIndexes),
      }));

    const result = calcScores(questions, normalizedAnswers);

    // attemptNo = آخرین attempt + 1
    const last = await QuizAttempt.findOne({ quizItemId: itemId, studentId })
      .sort({ attemptNo: -1 })
      .select("attemptNo");

    const attemptNo = last ? Number(last.attemptNo || 0) + 1 : 1;

    const attempt = await QuizAttempt.create({
      courseId,
      quizItemId: itemId,
      studentId,
      attemptNo,
      answers: normalizedAnswers,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage,
      breakdown: result.breakdown,
      submittedAt: new Date(),
    });

    return res.status(200).json({
      message: "Quiz submitted",
      result: {
        attemptId: attempt._id,
        attemptNo: attempt.attemptNo,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        breakdown: attempt.breakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuizItem,
  updateQuizItem,
  submitQuiz,
};
