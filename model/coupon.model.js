const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Custom validator to ensure either discount_value or discount_percentage is present
const discountValidator = function() {
  return (this.discount_value && !this.discount_percentage) || (!this.discount_value && this.discount_percentage);
};

// Coupon Schema
const couponSchema = new Schema({
  coupon_code: {
    type: String,
    required: true,
  },
  discount_value: {
    type: Number,
    validate: [discountValidator, 'Either discount_value or discount_percentage must be provided, but not both.']
  },
  discount_percentage: {
    type: Number,
    validate: [discountValidator, 'Either discount_value or discount_percentage must be provided, but not both.']
  },
  discount_upto: {
    type: Number,
    required: true,
  },
  discount_type: {
    type: String,
    enum: ['value', 'percentage'],
    required: true,
  },
  minimum_order_value: {
    type: Number,
    required: true,
  },
  count: {
    type: Number,
    required: true
  },
  expiry_date: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;