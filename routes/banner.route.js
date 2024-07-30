const UserControllers = require("../controllers/user.Controller");
const { upload } = require("../config/fileUpload");
const router = require("express").Router();

router.post("/add", upload.array("bannerfile"), UserControllers.addBanner);
router.post(
  "/update/:banner_id",
  upload.array("bannerfile"),
  UserControllers.update_banner
);

module.exports = router;
