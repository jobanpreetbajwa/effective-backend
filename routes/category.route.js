const categoryController = require("../controllers/category.controller");
const router = require("express").Router();

router.post("/add", categoryController.addCategory);
router.post("/add-bulk", categoryController.addBulkCategories);
router.get("/get", categoryController.getAllCategories);
router.get("/get/:category_id", categoryController.getProductsByCategory);
router.post(
  "/get/:category_id/:limit/:page",
  categoryController.getProductsLimitByCategory
);
router.get(
  "/subcategory/:category_id",
  categoryController.getSubCategoryByCategory
);
router.post("/search", categoryController.searchCategory);
router.get("/:id", categoryController.getProductsByCategory);
router.post(
  "/sub-product/:category_id",
  categoryController.getProductsBySubCategories
);

router.put("/update/:categoryId", categoryController.updateCategory);
router.delete("/delete/:categoryId", categoryController.deleteCategory);
router.post("/reorder", categoryController.reorderCategories);
router.post("/reorder-product-category", categoryController.reorderCategory);

module.exports = router;
