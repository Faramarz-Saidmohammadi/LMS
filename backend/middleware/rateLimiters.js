const rateLimit = require("express-rate-limit");

// helper for consistent key - supports IPv6
const keyByIP = (req) => {
  // Use the built-in ipKeyGenerator for proper IPv6 support
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "unknown";
  // Normalize IPv4-mapped IPv6 addresses
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // login/register brute-force protection
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIP,
  message: { message: "Too many auth requests. Please try again later." },
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8, // verify code / forgot password
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIP,
  message: { message: "Too many email requests. Please try again later." },
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // public pages like student catalog
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIP,
  message: { message: "Too many requests. Please slow down." },
});

module.exports = { authLimiter, emailLimiter, publicLimiter };
