const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP images are allowed"), false);
  }
  cb(null, true);
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("avatar");

module.exports = uploadAvatar;
