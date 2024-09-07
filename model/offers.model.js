const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bogo', 'free_shipping', 'bundle', 'seasonal', 'loyalty', 'flash'],
    required: true
  },
  description: String,
  discountPercent: Number, // For percentage and fixed amount discounts
  discountUpto:Number, // For percentage and fixed amount discounts
  minOrderValue: Number, // Minimum order value to apply the offer
  // applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // For specific product offers
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  timeStamp: {
    type: Date,
    default: Date.now
  }
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;