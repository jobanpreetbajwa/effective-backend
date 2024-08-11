const router = require("express").Router();
const paymentController = require("../controllers/payment.Controller");
const PaymentController = require("../controllers/payment.Controller");

// router.post("/create", PaymentController.createPayment);
router.post("/checkAvailability", PaymentController.checkAndMakeReservation);
router.post("/productAvailability",paymentController.productAvailability)

module.exports = router;