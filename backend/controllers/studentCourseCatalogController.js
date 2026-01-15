const mongoose = require("mongoose");
const Course = require("../models/Course");
const { getPagination, buildSearchFilter, buildSort, buildMeta } = require("../utils/queryHelpers");

const listStudentCourses = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const category = String(req.query.category || "").trim();
    const search = String(req.query.search || "").trim();
    const sort = String(req.query.sort || "").trim();

    const filter = { status: "published" };

    // category filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    // search filter
    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(filter, searchFilter);

    const sortObj = buildSort(sort);

    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter)
        .select(
          "title shortDesc category instructorId status publishedAt startDate duration thumbnail stats createdAt"
        )
        .populate("category", "name slug")
        .populate("instructorId", "name avatar.url")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      meta: buildMeta({ page, limit, total }),
      courses,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listStudentCourses };
