const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const requestLogger = require("./middleware/requestLogger");
const { authLimiter, emailLimiter, publicLimiter } = require("./middleware/rateLimiters");

const healthRoutes = require("./routes/healthRoutes");

const authRoutes = require("./routes/authRoutes");
const adminInvitationRoutes = require("./routes/adminInvitationRoutes");

const meRoutes = require("./routes/meRoutes");
const collabDashboardRoutes = require("./routes/collabDashboardRoutes");
const collabChangeRequestRoutes = require("./routes/collabChangeRequestRoutes");
const adminChangeRequestRoutes = require("./routes/adminChangeRequestRoutes");

const uploadRoutes = require("./routes/uploadRoutes");

const categoryRoutes = require("./routes/categoryRoutes");
const adminCategoryRoutes = require("./routes/adminCategoryRoutes");

const courseRoutes = require("./routes/courseRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const quizRoutes = require("./routes/quizRoutes");
const collabCourseRoutes = require("./routes/collabCourseRoutes");

const adminCourseListRoutes = require("./routes/adminCourseListRoutes");
const adminCourseRoutes = require("./routes/adminCourseRoutes");

const adminItemRoutes = require("./routes/adminItemRoutes");
const studentCourseRoutes = require("./routes/studentCourseRoutes");

const enrollmentRoutes = require("./routes/enrollmentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(requestLogger);

app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Swagger docs فقط وقتی test نیست
if (process.env.NODE_ENV !== "test") {
  // اگر فایل موجود نبود، سرور کرش نکند
  try {
    const docsRoutes = require("./routes/docsRoutes");
    app.use("/", docsRoutes);
  } catch (e) {
    // ignore docs in case it's missing
  }
}

// ✅ Health
app.use("/health", healthRoutes);

// ✅ Auth limiter + routes
app.use("/auth", authLimiter, authRoutes);

// ✅ Email limiter
app.use("/auth/send-verify-code", emailLimiter);
app.use("/auth/forgot-password", emailLimiter);
app.use("/auth/reset-password", emailLimiter);

// ✅ Admin invitations
app.use("/admin/invitations", authLimiter, adminInvitationRoutes);

// ✅ Me routes
app.use("/", meRoutes);

// ✅ Collaborator
app.use("/collab", collabDashboardRoutes);
app.use("/collab", collabChangeRequestRoutes);

// ✅ Admin change requests
app.use("/admin", adminChangeRequestRoutes);

// ✅ Upload
app.use("/uploads", uploadRoutes);

// ✅ Public routes limiter
app.use("/student/courses", publicLimiter, studentCourseRoutes);
app.use("/categories", publicLimiter, categoryRoutes);

app.use("/admin/categories", adminCategoryRoutes);

// Courses & curriculum & quizzes
app.use("/courses", courseRoutes);
app.use("/courses", curriculumRoutes);
app.use("/courses", quizRoutes);

// Collaborator actions
app.use("/collab/courses", collabCourseRoutes);

// Admin course list + actions
app.use("/admin/courses", adminCourseListRoutes);
app.use("/admin/courses", adminCourseRoutes);

// Admin item review
app.use("/admin", adminItemRoutes);

// Enrollment, reviews, notifications, certificates
app.use("/", enrollmentRoutes);
app.use("/courses", reviewRoutes);
app.use("/", notificationRoutes);
app.use("/", certificateRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
