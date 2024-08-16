const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Product Schema
const productSchema = new Schema({
  srn: {
    type: Number,
  },
  is_pricing: {
    type: Boolean,
    default: false,
  },
  // parent_id: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Product",
  //   default: null,
  // },
  size: {
    type: Schema.Types.ObjectId,
    ref: "SizeChart",
  },
  color: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  variable_price: {
    type: Boolean,
  },
  prices: {
    type: [Object],
  },
  description: {
    type: String,
  },
  prod_status: {
    type: Boolean,
  },
  inventory_available: {
    type: Boolean,
    default: true,
  },
  prod_quantity: {
    type: Number,
  },
  weight: {
    type: Number,
  },
  mrp_price: {
    type: Number,
  },
  discounted_price: {
    type: Number,
    default: 0,
  },
  min_order_quantity: {
    type: Number,
  },
  max_order_quantity: {
    type: Number,
  },
  // shipping_cost: {
  //   type: Number,
  // },
  // tax_rate: {
  //   type: Number,
  // },
  // variants: {
  //   type: [Object],
  // },
  // cod: {
  //   type: Boolean, // true-> avaliable
  // },
  // refund: {
  //   type: Boolean, //true-> available
  // },
  img_ids: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Image",
      },
    ],
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
