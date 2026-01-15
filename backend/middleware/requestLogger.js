const pinoHttp = require("pino-http");
const logger = require("../utils/logger");

const requestLogger = pinoHttp({
  logger,
  customLogLevel: function (res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.ip,
      };
    },
  },
});

module.exports = requestLogger;
