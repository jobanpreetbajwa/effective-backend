const express = require("express");
const customerController = require("../controllers/customer.controller");

const router = express.Router();

router.get("/get/:limit/:page/:type", customerController.getCustomers);
router.get("/customer-excel/:type", customerController.getCustomersExcel);
router.post("/search/:limit/:page/:type", customerController.searchCustomers);
router.get("/details", customerController.getCustomer);
router.post('/emailverify', customerController.emailVerify);
router.post('/otpverify', customerController.otpVerify);
router.post('/resendotp', customerController.resendOtp);
router.post('/wishlist', customerController.addToWishlist);
router.delete('/wishlist', customerController.removeFromWishlist);
router.get('/wishlist/:user_id', customerController.getWishlist);

module.exports = router;
