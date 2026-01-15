module.exports = (allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error("requireRoles expects a non-empty array of roles");
  }

  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const ok = allowedRoles.some((r) => roles.includes(r));

    if (!ok) {
      return res.status(403).json({
        message: "Forbidden (insufficient role)",
        required: allowedRoles,
      });
    }

    next();
  };
};
