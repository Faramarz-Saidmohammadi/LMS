const rateLimit = require("express-rate-limit");

// verify-code / reset-password (public)
const emailPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many email requests. Please try again later." },
});

// forgot/reset password stricter
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset requests. Please try again later." },
});

// admin invitations
const emailAdminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many invitation emails. Try again later." },
});

module.exports = {
  emailPublicLimiter,
  passwordResetLimiter,
  emailAdminLimiter,
};
