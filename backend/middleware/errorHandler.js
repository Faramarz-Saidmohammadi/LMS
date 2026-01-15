const AppError = require("../utils/appError");

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // اگر AppError بود
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate value error";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  // pino-http sets req.log
  if (req.log) {
    req.log.error(
      {
        statusCode,
        err: { message: err.message, stack: process.env.NODE_ENV === "production" ? undefined : err.stack },
      },
      "Request error"
    );
  } else {
    console.error(err);
  }

  return res.status(statusCode).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
