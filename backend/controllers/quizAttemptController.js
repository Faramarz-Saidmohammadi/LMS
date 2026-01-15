const { z } = require("zod");

const Enrollment = require("../models/Enrollment");
const CurriculumItem = require("../models/CurriculumItem");
const QuizAttempt = require("../models/QuizAttempt");

// Helper: نمره‌دهی سوال
const normalize = (v) => {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v.trim().toLowerCase();
  return String(v).trim().toLowerCase();
};

const isAnswerCorrect = (given, correct) => {
  // correct می‌تواند string/number باشد یا array (برای multi select)
  if (Array.isArray(correct)) {
    // هر دو را به set تبدیل کن
    const gArr = Array.isArray(given) ? given : [given];
    const gSet = new Set(gArr.map(normalize));
    const cSet = new Set(correct.map(normalize));

    if (gSet.size !== cSet.size) return false;
    for (const x of cSet) if (!gSet.has(x)) return false;
    return true;
  }

  return normalize(given) === normalize(correct);
};

const calcQuizScore = (questions = [], answers = []) => {
  // answers expected: [{index, answer}]  OR  [{questionIndex, answer}]
  const answerMap = new Map();
  for (const a of answers || []) {
    const idx = a?.index ?? a?.questionIndex;
    if (Number.isInteger(idx)) answerMap.set(idx, a?.answer);
  }

  let maxScore = 0;
  let score = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] || {};
    const qScore = Number(q.score ?? 1);
    const safeScore = Number.isFinite(qScore) && qScore > 0 ? qScore : 1;

    maxScore += safeScore;

    const given = answerMap.get(i);
    const correct = q.correctAnswer;

    if (correct !== undefined && correct !== null) {
      if (isAnswerCorrect(given, correct)) score += safeScore;
    }
  }

  if (maxScore <= 0) maxScore = 1;

  const percent = Math.round((score / maxScore) * 10000) / 100; // 2 decimals
  return { score, maxScore, percent };
};

// ✅ POST /courses/:id/quizzes/:itemId/submit
const submitQuiz = async (req, res, next) => {
  try {
    const studentId = req.user.userId;
    const courseId = req.params.id;
    const itemId = req.params.itemId;

    // validate body
    const schema = z.object({
      answers: z.array(
        z.object({
          index: z.number().int().optional(),
          questionIndex: z.number().int().optional(),
          answer: z.any(),
        })
      ),
    });

    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid answers format",
        errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    // ✅ must be enrolled
    const enrollment = await Enrollment.findOne({ studentId, courseId }).lean();
    if (!enrollment) {
      return res.status(403).json({ message: "You must enroll in the course before taking the quiz" });
    }

    // ✅ quiz item must exist and be approved
    const item = await CurriculumItem.findOne({
      _id: itemId,
      courseId,
      type: "quiz",
      status: "approved",
    }).lean();

    if (!item) {
      return res.status(404).json({ message: "Quiz item not found or not approved yet" });
    }

    // get quiz config
    const quiz = item.quiz || {};
    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];

    if (!questions.length) {
      return res.status(400).json({ message: "Quiz has no questions configured" });
    }

    // maxAttempts & passingScore (defaults)
    const maxAttempts = Number(quiz.maxAttempts ?? 3);
    const passingScore = Number(quiz.passingScore ?? 60); // percent

    const safeMaxAttempts = Number.isFinite(maxAttempts) && maxAttempts > 0 ? Math.floor(maxAttempts) : 3;
    const safePassingScore =
      Number.isFinite(passingScore) && passingScore >= 0 && passingScore <= 100 ? passingScore : 60;

    // ✅ attempts count
    const attemptsCount = await QuizAttempt.countDocuments({ studentId, courseId, itemId });

    if (attemptsCount >= safeMaxAttempts) {
      return res.status(400).json({
        message: "Max attempts reached",
        maxAttempts: safeMaxAttempts,
        attemptsUsed: attemptsCount,
        attemptsLeft: 0,
      });
    }

    // ✅ grading
    const { score, maxScore, percent } = calcQuizScore(questions, parsed.data.answers);
    const passed = percent >= safePassingScore;

    const attemptNumber = attemptsCount + 1;

    const attempt = await QuizAttempt.create({
      studentId,
      courseId,
      itemId,
      attemptNumber,
      answers: parsed.data.answers,
      score,
      maxScore,
      percent,
      passed,
      submittedAt: new Date(),
    });

    const attemptsLeft = Math.max(0, safeMaxAttempts - attemptNumber);

    return res.status(201).json({
      message: "Quiz submitted",
      result: {
        attemptId: attempt._id,
        attemptNumber,
        score,
        maxScore,
        percent,
        passed,
        passingScore: safePassingScore,
        maxAttempts: safeMaxAttempts,
        attemptsLeft,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GET /courses/:id/quizzes/:itemId/attempts  (history)
const getMyQuizAttempts = async (req, res, next) => {
  try {
    const studentId = req.user.userId;
    const courseId = req.params.id;
    const itemId = req.params.itemId;

    // must be enrolled
    const enrollment = await Enrollment.findOne({ studentId, courseId }).lean();
    if (!enrollment) {
      return res.status(403).json({ message: "You must enroll in the course to view attempts" });
    }

    const attempts = await QuizAttempt.find({ studentId, courseId, itemId })
      .sort({ submittedAt: -1 })
      .lean();

    return res.status(200).json({ attempts });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitQuiz,
  getMyQuizAttempts,
};
