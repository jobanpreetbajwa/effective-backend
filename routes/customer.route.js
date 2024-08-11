const express = require("express");
const customerController = require("../controllers/customer.controller");

const router = express.Router();

router.get("/get/:limit/:page/:type", customerController.getCustomers);
router.get("/customer-excel/:type", customerController.getCustomersExcel);
router.post("/search/:limit/:page/:type", customerController.searchCustomers);
router.post('/emailverify', customerController.emailVerify);
router.post('/otpverify', customerController.otpVerify);

module.exports = router;
