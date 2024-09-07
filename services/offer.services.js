
const Offer = require('../model/offers.model');
const Product = require('../model/product.model');
const Coupon = require('../model/coupon.model');
async function getOffers() {
    return Offer.find();
}

async function createOffer(offer) {
    return Offer.create(offer);
}

async function deleteOffer(id) {
    return Offer.findByIdAndDelete(id);
}

async function bindProducts(offerId, productIds) {
    const offer = await Offer.findById(offerId);
    if (!offer) {
        throw new Error('Offer not found');
    }
    const productsToBind = await Product.find({ _id: { $in: productIds } });
    console.log(productsToBind,'productsToBind');
    if (productsToBind.length !== productIds.length) {
        throw new Error('Some products not found');
    }

    // Add offerId to each product's offers array
    await Product.updateMany(
        { _id: { $in: productIds } },
        { $push: { offers: { $each: [offerId], $position: 0 } } }
    );

    return offer.save();
}

async function createCoupon({ coupon_code, discount_value, discount_upto,count }) {
    return Coupon.create({ coupon_code, discount_value, discount_upto ,count});
}

async function applyCoupon(coupon_code) {
    const coupon = await
        Coupon.findOne({ coupon_code });
    if (!coupon) {
        throw new Error('Coupon not found');
    }
    return coupon;
}

module.exports = {
    getOffers,
    createOffer,
    deleteOffer,
    bindProducts,
    createCoupon,
}