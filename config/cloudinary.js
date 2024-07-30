const { v2 } = require("cloudinary");
const fs = require("fs");
const { Readable } = require("stream");

const cloudinary = v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinaryAndSave = async (filePath, fileName) => {
  
  let url;

  const data = await new Promise((res, rej) => {
  
    
    const theTransformStream = cloudinary.uploader.upload_stream(
      {
        stream: true,
        resource_type: "auto",
        secure: true,
      },
      (err, result) => {
        if (err) return rej(err);
        res(result);
      }
    );
    let str = Readable.from(filePath);
    str.pipe(theTransformStream);
  });
  
  return data;
};

const DeleteFileFromCloudinary = async (image_ids) => {
  await Promise.all(
    image_ids.map(async (image_id) => {
      await cloudinary.uploader.destroy(image_id, {
        type: "upload",
        resource_type: "image",
      });
    })
  );

  return;
};

module.exports = { uploadFileToCloudinaryAndSave, DeleteFileFromCloudinary };
