const sharp = require("sharp");
const path = require("path");

// Function to resize and compress image
async function optimizeImage(file, quality) {
  // Get the size of the original image
  let originalSize = file.buffer.length;

  let format;
  if (file.mimetype === "image/jpeg") {
    format = "jpeg";
  } else if (file.mimetype === "image/png") {
    format = "png";
  } else {
    throw new Error("Unsupported image format");
  }

  // Compress the image
  let compressedImage = await sharp(file.buffer)
    .toFormat(format, { quality })
    .toBuffer();

  // Get the size of the compressed image
  let compressedSize = compressedImage.length;

  // Log the compression ratio and size reduction
  let compressionRatio = originalSize / compressedSize;
  // console.log(`Original size: ${originalSize} bytes`);
  // console.log(`Compressed size: ${compressedSize} bytes`);
  // console.log(`Compression ratio: ${compressionRatio.toFixed(2)}`);

  return compressedImage;
}

module.exports = optimizeImage;
