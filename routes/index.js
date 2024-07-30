const router = require("express").Router();
const AdminRoutes = require("../routes/admin.route");
const CategoryRoutes = require("../routes/category.route");
const SubCategoryRoutes = require("../routes/subcategory.route");
const ProductRoutes = require("../routes/product.route");
const UserRoutes = require("../routes/user.route");
const ImageRoutes = require("../routes/image.route");
const ThemePreviewRoutes = require("../routes/theme_preview.route");
const CustomerRoutes = require("../routes/customer.route");

router.use("/category", CategoryRoutes);
router.use("/subcategory", SubCategoryRoutes);
router.use("/product", ProductRoutes);
router.use("/admin", AdminRoutes);
router.use("/user", UserRoutes);
router.use("/image", ImageRoutes);
router.use("/theme-preview", ThemePreviewRoutes);
router.use("/customers", CustomerRoutes);

module.exports = router;
