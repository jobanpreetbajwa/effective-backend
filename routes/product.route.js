const productController = require("../controllers/product.controller");

const router = require("express").Router();

router.post("/add", productController.addProduct);
router.patch("/", productController.updateProduct);
router.patch("/:product_id/:status", productController.updateProductStatus);
router.post("/search", productController.searchProduct);
router.post(
  "/search_by_category/:category_id",
  productController.searchProductByCategory
);
router.delete(
  "/delete/:category_id/:product_id",
  productController.deleteProduct
);
router.delete("/delete-bulk/:category_id", productController.deleteBulkProduct);
router.get("/:product_id", productController.getProductById);
router.get(
  "/subcategory/:product_id",
  productController.getSubCategoryByProduct
);
router.post(
  "/reorder/:category_id/:product_id",
  productController.reorderProducts
);
router.post("/add-bulk/:category_id", productController.addBulkProducts);
router.patch("/edit-bulk", productController.editBulkProducts);
router.get("/product-excel/:category_id", productController.getProductsExcel);
router.get("/excel/sample", productController.getProductsSampleExcel);
module.exports = router;
