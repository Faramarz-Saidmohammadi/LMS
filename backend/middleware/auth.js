const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const fromCookie = req.cookies?.access_token;

    const authHeader = req.headers.authorization;
    const fromHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const token = fromCookie || fromHeader;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized (token missing)" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Server misconfig: JWT_SECRET missing" });
    }

    const decoded = jwt.verify(token, secret);

    req.user = {
      userId: decoded.userId,
      roles: decoded.roles || [],
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized (token expired)" });
    }
    return res.status(401).json({ message: "Unauthorized (invalid token)" });
  }
};
