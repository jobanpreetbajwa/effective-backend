const ImageController = require("../controllers/image.controller");
const { upload } = require("../config/fileUpload");
const router = require("express").Router();

router.post("/upload", upload.single("file"), (req, res, next) => {
  // If multer encounters an error, it will be passed to the next middleware
  // You can check for multer errors and handle them here
  if (req.fileValidationError) {
    return res.status(400).json({ message: req.fileValidationError });
  } else if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // If there are no multer errors, proceed with your upload logic
  ImageController.uploadImage(req, res);
});
router.delete("/delete", ImageController.deleteUntrackedImages);
module.exports = router;
