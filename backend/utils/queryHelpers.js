const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const getPagination = (query) => {
  const page = toInt(query.page, 1);
  const limit = Math.min(toInt(query.limit, 12), 50); // max 50
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchFilter = (search) => {
  const s = String(search || "").trim();
  if (!s) return null;

  // regex search for title/shortDesc (safe + basic)
  const re = new RegExp(escapeRegex(s), "i");
  return { $or: [{ title: re }, { shortDesc: re }] };
};

const buildSort = (sort) => {
  // sort options:
  // newest | oldest | title_asc | title_desc | rating | students
  const s = String(sort || "").trim().toLowerCase();

  if (s === "oldest") return { createdAt: 1 };
  if (s === "title_asc") return { title: 1 };
  if (s === "title_desc") return { title: -1 };

  // اگر این فیلدها در Course داری، خیلی عالی. اگر نداشته باشی، مشکلی نمی‌شود.
  if (s === "rating") return { "stats.avgRating": -1, "stats.ratingCount": -1, createdAt: -1 };
  if (s === "students") return { "stats.enrolledCount": -1, createdAt: -1 };

  // default
  return { createdAt: -1 };
};

const buildMeta = ({ page, limit, total }) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
};

module.exports = {
  getPagination,
  buildSearchFilter,
  buildSort,
  buildMeta,
};
