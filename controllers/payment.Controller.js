const checkAndMakeReservation = require("../services/payment.service").checkAndMakeReservation;
const checkProductAvailability = require("../services/payment.service").checkProductAvailability;
class paymentController {
  async checkAndMakeReservation(req, res) {
    try {
      let { cartItems } = req.body;
      let products = await checkAndMakeReservation(cartItems);
      res.status(200).json(products);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async productAvailability(req, res) {
    try {
      let { product } = req.body;
      let products = await checkProductAvailability(product);
      res.status(200).json(products);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new paymentController();