const router = require("express").Router();
const offerController = require("../controllers/offer.controller");

router.get('/',offerController.getOffers);
router.post('/create',offerController.createOffer);
router.post('/bind-products/:offerId',offerController.bindProducts);
router.delete('/delete/:id',offerController.deleteOffer);

module.exports = router;