const { uploadBuffer } = require("../utils/cloudinary");

const uploadAttachment = async (req, res, next) => {
  try {
    // multer puts file on req.file
    if (!req.file) return res.status(400).json({ message: "No file provided (field name must be: file)" });

    const folder = "lms/attachments";

    const result = await uploadBuffer({
      buffer: req.file.buffer,
      folder,
      resourceType: "raw",
      mimeType: req.file.mimetype,
    });

    return res.status(201).json({
      message: "Attachment uploaded",
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    });
  } catch (err) {
    next(err);
  }
};

const uploadCertificate = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided (field name must be: file)" });

    const folder = "lms/certificates";

    const result = await uploadBuffer({
      buffer: req.file.buffer,
      folder,
      resourceType: "raw",
      mimeType: req.file.mimetype,
    });

    return res.status(201).json({
      message: "Certificate uploaded",
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadAttachment,
  uploadCertificate,
};
