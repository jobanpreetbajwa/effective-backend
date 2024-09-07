
const Offer = require('../model/offers.model');
const Product = require('../model/product.model');
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
module.exports = {
    getOffers,
    createOffer,
    deleteOffer,
    bindProducts
}