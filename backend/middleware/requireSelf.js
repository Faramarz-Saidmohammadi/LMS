module.exports = (paramKey = "userId") => {
  return (req, res, next) => {
    const targetId = req.params[paramKey];
    const myId = String(req.user?.userId || "");

    if (!targetId) {
      return res.status(400).json({ message: `Missing param: ${paramKey}` });
    }

    if (String(targetId) !== myId) {
      return res.status(403).json({ message: "Forbidden (not your resource)" });
    }

    next();
  };
};
