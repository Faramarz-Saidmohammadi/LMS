// const router = require("express").Router();

// const auth = require("../middleware/auth");
// const requireRoles = require("../middleware/requireRoles");

// const {
//   enrollCourse,
//   getMyEnrollments,
//   completeCourseItem,
// } = require("../controllers/enrollmentController");

// // student/admin => enroll
// router.post("/courses/:id/enroll", auth, requireRoles(["student", "admin"]), enrollCourse);

// // student/admin => my enrollments
// router.get("/me/enrollments", auth, requireRoles(["student", "admin"]), getMyEnrollments);

// // student/admin => complete item
// router.post(
//   "/courses/:id/progress/complete-item",
//   auth,
//   requireRoles(["student", "admin"]),
//   completeCourseItem
// );

// module.exports = router;

const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRoles = require("../middleware/requireRoles");

const {
  enrollCourse,
  getMyEnrollments,
  completeCourseItem,
} = require("../controllers/enrollmentController");

/**
 * ============================================================================
 * Enrollment Routes (Student Progress / Enrollment API Contract)
 * ============================================================================
 *
 * ✅ Auth:
 * - Requires JWT access token
 * - Token can be provided via:
 *   1) Cookie:  access_token
 *   2) Header:  Authorization: Bearer <token>
 *
 * ✅ Roles Allowed:
 * - student
 * - admin
 *
 * ============================================================================
 * IMPORTANT NOTES FOR FRONTEND (Contract Rules)
 * ----------------------------------------------------------------------------
 * 1) Only published courses can be enrolled.
 * 2) Student progress is calculated ONLY based on APPROVED curriculum items.
 * 3) Completing the same item twice is safe (idempotent) - it won’t duplicate.
 * 4) This module does NOT return full course curriculum. It assumes the student
 *    already sees approved items elsewhere.
 * ============================================================================
 */

/**
 * ----------------------------------------------------------------------------
 * POST /courses/:id/enroll
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - Enroll the current student/admin into a published course.
 *
 * AUTH:
 * - Required (auth middleware)
 *
 * ROLES:
 * - student OR admin
 *
 * PARAMS:
 * - id (string, required) => courseId (MongoDB ObjectId)
 *
 * BODY:
 * - none
 *
 * SUCCESS RESPONSES:
 * - 201 Created:
 *   {
 *     message: "Enrolled successfully",
 *     enrollment: {
 *       _id,
 *       studentId,
 *       courseId,
 *       progressPercent: 0,
 *       completedItems: [],
 *       isCompleted: false,
 *       completedAt: null,
 *       lastAccessed
 *     }
 *   }
 *
 * - 200 OK (Already enrolled):
 *   {
 *     message: "Already enrolled",
 *     enrollment: {...existing enrollment...}
 *   }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request:
 *   { message: "Invalid course id" }
 *
 * - 404 Not Found:
 *   { message: "Course not found or not published" }
 *
 * FRONTEND USAGE:
 * - Call when user clicks "Enroll" button.
 * - If response is 200 Already enrolled, treat it as success.
 */
router.post(
  "/courses/:id/enroll",
  auth,
  requireRoles(["student", "admin"]),
  enrollCourse
);

/**
 * ----------------------------------------------------------------------------
 * GET /me/enrollments
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - Get all enrollments for the current user (student/admin),
 *   including basic course info and category.
 *
 * AUTH:
 * - Required
 *
 * ROLES:
 * - student OR admin
 *
 * PARAMS:
 * - none
 *
 * QUERY:
 * - none
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   {
 *     enrollments: [
 *       {
 *         _id,
 *         courseId: {
 *           _id,
 *           title,
 *           shortDesc,
 *           status,
 *           publishedAt,
 *           category: { _id, name, slug }
 *         },
 *         progressPercent,
 *         isCompleted,
 *         completedAt,
 *         updatedAt
 *       }
 *     ]
 *   }
 *
 * ERROR RESPONSES:
 * - 401 Unauthorized (token missing/expired/invalid)
 * - 403 Forbidden (role not allowed)
 *
 * FRONTEND USAGE:
 * - Use this endpoint for "My Courses" page.
 * - Sort is already handled in backend (latest updated first).
 */
router.get(
  "/me/enrollments",
  auth,
  requireRoles(["student", "admin"]),
  getMyEnrollments
);

/**
 * ----------------------------------------------------------------------------
 * POST /courses/:id/progress/complete-item
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * - Mark a curriculum item as completed by the student.
 * - Updates enrollment progressPercent and completion status.
 *
 * AUTH:
 * - Required
 *
 * ROLES:
 * - student OR admin
 *
 * PARAMS:
 * - id (string, required) => courseId (MongoDB ObjectId)
 *
 * BODY:
 * - itemId (string, required) => curriculum item id (MongoDB ObjectId)
 *
 * IMPORTANT RULES:
 * - Student can only complete items that are:
 *   (a) belongs to the same course
 *   (b) status === "approved"
 *
 * SUCCESS RESPONSE:
 * - 200 OK:
 *   {
 *     message: "Progress updated",
 *     progress: {
 *       courseId,
 *       progressPercent,          // number (0..100)
 *       totalApprovedItems,       // number
 *       completedApprovedItems,   // number
 *       isCompleted,              // boolean
 *       completedAt,              // date|null
 *       lastAccessed              // date
 *     }
 *   }
 *
 * ERROR RESPONSES:
 * - 400 Bad Request:
 *   { message: "Invalid course id" }
 *   { message: "Invalid itemId" }
 *   { message: "You are not enrolled in this course" }
 *
 * - 404 Not Found:
 *   { message: "Item not found or not approved for students" }
 *
 * FRONTEND USAGE:
 * - Call this after user finishes an item (e.g. clicked "Mark as Done").
 * - Use returned progressPercent to update progress UI.
 * - When progressPercent hits 100, enable "Generate Certificate".
 */
router.post(
  "/courses/:id/progress/complete-item",
  auth,
  requireRoles(["student", "admin"]),
  completeCourseItem
);

module.exports = router;
