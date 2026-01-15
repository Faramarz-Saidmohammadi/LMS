const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const connectDB = require("./db/connectDB");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const adminInvitationRoutes = require("./routes/adminInvitationRoutes");

const meRoutes = require("./routes/meRoutes");
const collabDashboardRoutes = require("./routes/collabDashboardRoutes");
const collabChangeRequestRoutes = require("./routes/collabChangeRequestRoutes");
const adminChangeRequestRoutes = require("./routes/adminChangeRequestRoutes");

const categoryRoutes = require("./routes/categoryRoutes");
const adminCategoryRoutes = require("./routes/adminCategoryRoutes");

const courseRoutes = require("./routes/courseRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const quizRoutes = require("./routes/quizRoutes");
const collabCourseRoutes = require("./routes/collabCourseRoutes");

// ✅ NEW: admin list
const adminCourseListRoutes = require("./routes/adminCourseListRoutes");

// existing admin routes (approve/reject/publish...)
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

app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/admin/invitations", adminInvitationRoutes);

app.use("/api", meRoutes);

app.use("/api/collab", collabDashboardRoutes);
app.use("/api/collab", collabChangeRequestRoutes);

app.use("/api/admin", adminChangeRequestRoutes);

// Categories
app.use("/api/categories", categoryRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);

// Courses (collaborator)
app.use("/api/courses", courseRoutes);

// Curriculum
app.use("/api/courses", curriculumRoutes);

// Quiz routes
app.use("/api/courses", quizRoutes);

// Collaborator actions
app.use("/api/collab/courses", collabCourseRoutes);

// ✅ Admin course list (GET /admin/courses...)
app.use("/api/admin/courses", adminCourseListRoutes);

// ✅ Admin course review + publish (POST approve/reject/publish...)
app.use("/api/admin/courses", adminCourseRoutes);

// Admin item review
app.use("/api/admin", adminItemRoutes);

// Student catalog (published only)
app.use("/api/student/courses", studentCourseRoutes);

// Enrollment + progress routes
app.use("/api", enrollmentRoutes);

// Reviews
app.use("/api/courses", reviewRoutes);

// Notifications
app.use("/api", notificationRoutes);

// Certificates
app.use("/api", certificateRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // await connectDB(process.env.MONGO_URI);
    console.log("⚠️ Running without MongoDB");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    process.exit(1);
  }
};

start();
