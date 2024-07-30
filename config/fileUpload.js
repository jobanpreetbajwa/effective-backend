const multer = require("multer");
const path = require("path");
const ErrorHandler = require("../utils/errorHandler");
const storage = multer.memoryStorage();
// const optimizeImage = require("../utils/optimiseImage");
const {
  uploadFileToCloudinaryAndSave,
  DeleteFileFromCloudinary,
} = require("../config/cloudinary");
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads");
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + "-" + path.extname(file.originalname)
//     );
//   },
// });
//try using this
var upload = multer({
  storage: storage,
  // limits: {
  //   fileSize: 5 * 1024 * 1024, // 1000000 Bytes = 1 MB
  // },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      // upload only png and jpg format
      const error = new ErrorHandler("Please upload valid jpg or png file.");
      error.code = 400;
      return cb(error);
    }
    cb(undefined, true);
  },
});

const uploadFile = async (file) => {
  let filename = Date.now() + "_" + file.originalname;
  let filePathOrData;
  if (file.path) {
    filePathOrData = file.path;
  } else if (file.buffer) {
    filePathOrData = file.buffer;
  } else {
    throw new Error("File object must have either a path or buffer property");
  }
  const { secure_url, public_id } = await uploadFileToCloudinaryAndSave(
    filePathOrData,
    filename
  );
  return { url: secure_url, public_id };
};
//const upload = multer({ storage: storage });
module.exports = { upload, uploadFile };
