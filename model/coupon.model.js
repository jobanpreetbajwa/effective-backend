const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Coupon Schema
const couponSchema = new Schema({
  coupon_code: {
    type: String,
    required: true,
  },
  discount_value: {
    type: Number,
    required: true,
  },
  discount_upto: {
    type: Number,
    required: true,
  },
  count: {
    type: Number,
    required:true
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