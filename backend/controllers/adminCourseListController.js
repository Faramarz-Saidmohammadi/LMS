const mongoose = require("mongoose");
const Course = require("../models/Course");
const { getPagination, buildSearchFilter, buildSort, buildMeta } = require("../utils/queryHelpers");

const listAdminCourses = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const status = String(req.query.status || "").trim(); // draft/under_review/rejected/approved/published
    const search = String(req.query.search || "").trim();
    const sort = String(req.query.sort || "newest").trim();

    const filter = {};

    // status filter
    if (status) filter.status = status;

    // search
    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(filter, searchFilter);

    // sorting
    const sortObj = buildSort(sort);

    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter)
        .select("title shortDesc category instructorId status publishedAt createdAt updatedAt")
        .populate("category", "name slug")
        .populate("instructorId", "name email roles")
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

module.exports = { listAdminCourses };
