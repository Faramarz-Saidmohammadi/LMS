const { z } = require("zod");

const Course = require("../models/Course");
const CourseSection = require("../models/CourseSection");
const CurriculumItem = require("../models/CurriculumItem");
const CourseChangeRequest = require("../models/CourseChangeRequest");

// فقط همین فیلدها اجازه تغییر دارند
const ALLOWED_COURSE_FIELDS = ["title", "shortDesc", "startDate", "duration", "category"];

const createChangeRequest = async (req, res, next) => {
  try {
    const collaboratorId = req.user.userId;
    const courseId = req.params.id;

    // فقط published باید change-request داشته باشد
    const course = await Course.findOne({ _id: courseId, instructorId: collaboratorId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "published") {
      return res.status(400).json({
        message: `Change Request only allowed for published courses. Current status: ${course.status}`,
      });
    }

    const schema = z.object({
      type: z.enum(["course_details", "curriculum_add", "curriculum_update"]),
      payload: z.any(),
    });

    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const { type } = parsed.data;
    const payload = parsed.data.payload || {};

    // ✅ validate payload based on type
    let finalPayload = {};

    if (type === "course_details") {
      // payload = { title?, shortDesc?, startDate?, duration?, category? }
      for (const key of ALLOWED_COURSE_FIELDS) {
        if (payload[key] !== undefined) finalPayload[key] = payload[key];
      }

      if (Object.keys(finalPayload).length === 0) {
        return res.status(400).json({ message: "No valid course fields provided for update" });
      }
    }

    if (type === "curriculum_add") {
      // payload = { sectionId, item: { type, title, ... } }
      const addSchema = z.object({
        sectionId: z.string().min(10),
        item: z.object({
          type: z.enum(["article", "video", "quiz", "attachment"]),
          title: z.string().min(2).max(120),
          order: z.number().int().optional(),

          // article
          contentHtml: z.string().optional(),
          contentJson: z.any().optional(),

          // video
          youtubeUrl: z.string().optional(),
          videoLengthMinutes: z.number().optional(),
          isUnlistedDeclared: z.boolean().optional(),
          notesForAdminUpload: z.string().optional(),

          // quiz
          quiz: z
            .object({
              questions: z.array(z.any()).optional(),
              totalScore: z.number().optional(),
            })
            .optional(),

          // attachment
          fileUrl: z.string().optional(),
        }),
      });

      const addParsed = addSchema.safeParse(payload);
      if (!addParsed.success) {
        return res.status(400).json({
          message: "Invalid curriculum_add payload",
          errors: addParsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }

      // section belongs to course
      const section = await CourseSection.findOne({ _id: addParsed.data.sectionId, courseId: course._id });
      if (!section) return res.status(400).json({ message: "Section not found for this course" });

      finalPayload = {
        sectionId: section._id,
        item: addParsed.data.item,
      };
    }

    if (type === "curriculum_update") {
      // payload = { itemId, updates: {...} }
      const updSchema = z.object({
        itemId: z.string().min(10),
        updates: z.object({}).passthrough(),
      });

      const updParsed = updSchema.safeParse(payload);
      if (!updParsed.success) {
        return res.status(400).json({
          message: "Invalid curriculum_update payload",
          errors: updParsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }

      const item = await CurriculumItem.findOne({ _id: updParsed.data.itemId, courseId: course._id });
      if (!item) return res.status(400).json({ message: "Curriculum item not found for this course" });

      // محدودیت: حذف ممنوع، فقط update
      const forbiddenKeys = ["_id", "courseId", "sectionId", "status", "createdBy", "deleted", "isDeleted"];
      for (const k of forbiddenKeys) {
        if (updParsed.data.updates[k] !== undefined) {
          return res.status(400).json({ message: `You cannot change field: ${k}` });
        }
      }

      finalPayload = {
        itemId: item._id,
        updates: updParsed.data.updates,
      };
    }

    // ✅ create request
    const cr = await CourseChangeRequest.create({
      courseId: course._id,
      requestedBy: collaboratorId,
      type,
      payload: finalPayload,
      status: "pending",
    });

    return res.status(201).json({
      message: "Change request created",
      changeRequest: {
        id: cr._id,
        status: cr.status,
        type: cr.type,
        createdAt: cr.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createChangeRequest };
