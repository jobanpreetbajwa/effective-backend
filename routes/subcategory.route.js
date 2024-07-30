const subcategoryController = require("../controllers/subcategory.controller");

const router = require("express").Router();

router.post("/add/:category_id", subcategoryController.addSubCategory);
router.post(
  "/add-mul/:category_id",
  subcategoryController.addNewMulSubCategory
);

module.exports = router;
