const pino = require("pino");

const env = process.env.NODE_ENV || "development";
const isProd = env === "production";
const isTest = env === "test";

let transport;

// ✅ در test اصلاً transport نداشته باش
if (!isProd && !isTest) {
  // در dev فقط اگر pino-pretty نصب بود استفاده کن
  try {
    require.resolve("pino-pretty");
    transport = {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard" },
    };
  } catch (e) {
    transport = undefined; // fallback
  }
}

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "req.body.password", "req.body.passwordHash"],
    remove: true,
  },
  transport,
});

module.exports = logger;
