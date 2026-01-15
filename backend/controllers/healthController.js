const healthCheck = (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LMS backend is running",
    time: new Date().toISOString(),
  });
};

module.exports = { healthCheck };
