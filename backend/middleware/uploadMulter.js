const multer = require("multer");

// memory storage => no files saved on server
const storage = multer.memoryStorage();

const MAX_ATTACHMENT_MB = 25;   // attachment up to 25MB
const MAX_CERTIFICATE_MB = 10;  // certificate pdf up to 10MB

// Allowed mime types for attachments
const ATTACHMENT_MIME_WHITELIST = new Set([
  "application/pdf",

  "application/zip",
  "application/x-zip-compressed",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "text/plain",

  // images (optional - if you want)
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const certificateFileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF is allowed for certificate uploads"));
  }
  cb(null, true);
};

const attachmentFileFilter = (req, file, cb) => {
  if (!ATTACHMENT_MIME_WHITELIST.has(file.mimetype)) {
    return cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, ZIP, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, PNG/JPG/WEBP`
      )
    );
  }
  cb(null, true);
};

const uploadAttachmentMulter = multer({
  storage,
  limits: { fileSize: MAX_ATTACHMENT_MB * 1024 * 1024 },
  fileFilter: attachmentFileFilter,
});

const uploadCertificateMulter = multer({
  storage,
  limits: { fileSize: MAX_CERTIFICATE_MB * 1024 * 1024 },
  fileFilter: certificateFileFilter,
});

module.exports = {
  uploadAttachmentMulter,
  uploadCertificateMulter,
};
