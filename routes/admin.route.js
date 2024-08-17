const AdminControllers = require("../controllers/admin.Controller");
const router = require("express").Router();
const { upload } = require("../config/fileUpload");

router.post("/add-admin", AdminControllers.addAdmin);
router.post("/login", AdminControllers.loginAdmin);
router.post("/user-add", upload.single("file1"), AdminControllers.add_User);
router.post("/get-order-summary", AdminControllers.getGlobalSummary);
router.post("/get-order/:limit/:page", AdminControllers.getOrders);
router.get("/get-orderById/:order_id", AdminControllers.getOrderById);
router.put("/update-status/:order_id", AdminControllers.updateStatusOrder);
router.post("/search-order", AdminControllers.searchOrder);
router.patch("/add-note/:order_id", AdminControllers.addNote);
router.patch("/summary/:order_id/:showSummary", AdminControllers.toggleSummary);
router.get("/no-oftoday-orders/:cdate", AdminControllers.no_of_today_orders);
router.get(
  "/no-ofweekly-orders/:from_date/:to_date",
  AdminControllers.no_of_weekly_orders
);
router.get("/report-section/:date/:type", AdminControllers.report_section);
router.post(
  "/summary/:globalShowSummary",
  AdminControllers.toggleGlobalSummary
);
router.get("/summary", AdminControllers.getGlobalSummary);
router.get("/total-summary/:date", AdminControllers.total_report_summary);
router.get(
  "/pending-order-products/:limit/:page",
  AdminControllers.pending_orders_product_report
);
router.get(
  "/products-status-report/:limit/:page/:sort",
  AdminControllers.product_status_report
);
router.patch("/setting-update", AdminControllers.settingUpdate);
//router.put("/payment-setting-update", AdminControllers.paymentSettingsUpdate);
router.get("/profile", AdminControllers.getSettings);
router.get("/visitors-graph/:date/:type", AdminControllers.visitorGraph);
router.post("/update-order", AdminControllers.updateOrder);
module.exports = router;
