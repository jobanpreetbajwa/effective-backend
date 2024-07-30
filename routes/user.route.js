const UserControllers = require("../controllers/user.Controller");
const router = require("express").Router();
const categoryController = require("../controllers/category.controller");

router.post("/login", UserControllers.loginUser);
router.get("/all-category", UserControllers.category_list);
router.get(
  "/subcategory/:category_id",
  UserControllers.getSubCategoryByCategory
);
router.post("/get/:category_id", UserControllers.getProductsByCategory);
//router.post("/search-category", UserControllers.searchCategory);
router.post("/get-products", UserControllers.searchProduct_byCategoryName);
router.get("/product-details/:product_id", UserControllers.product_details);
router.post(
  "/sub-product/:category_id",
  UserControllers.getProductsBySubCategories
);
router.post("/review/:user_id/:product_id", UserControllers.addRating);
router.put("/update-rating/:user_id/:product_id", UserControllers.updateRating);
//router.get("/get-rating");
router.post("/place-order/:user_id", UserControllers.placeOrder);
router.get("/history/:user_id", UserControllers.orderHistory);
router.get("/order-details/:user_id/:order_id", UserControllers.orderDetails);
router.get("/theme-preview", UserControllers.getUserTheme);
router.get("/theme-preview/:_id", UserControllers.getUserThemePreviews);
//router.get("/views/:type/:cdate", UserControllers.getviews);
router.get("/visitors/:customer_id/:user_type", UserControllers.vistitor);
router.get("/views/:customer_id/:product_id/:user_type", UserControllers.views);
module.exports = router;
