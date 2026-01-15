const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️ Cloudinary env vars are missing. Upload routes will fail until configured.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer to Cloudinary using upload_stream (no temp files)
const uploadBuffer = ({ buffer, folder, publicId, resourceType = "raw", mimeType }) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType, // "raw" for pdf/zip/etc
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    if (publicId) options.public_id = publicId;

    // For images you might set format, but for raw we keep as is.
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    // Readable stream from buffer
    Readable.from(buffer).pipe(uploadStream);
  });
};

const deleteByPublicId = async ({ publicId, resourceType = "raw" }) => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  cloudinary,
  uploadBuffer,
  deleteByPublicId,
};
