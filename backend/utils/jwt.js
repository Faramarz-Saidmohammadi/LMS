const jwt = require("jsonwebtoken");

const signAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret) throw new Error("JWT_SECRET is missing in .env");

  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = { signAccessToken };
