const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    img_ids: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Image",
        },
      ],
    },
    business_name: {
      type: String,
    },
    phone_number: {
      type: Number,
    },
    email: {
      type: String,
    },
    store_address: {
      type: String,
    },
    your_name: {
      type: String,
    },
    facebook_link: {
      type: String,
    },
    insta_link: {
      type: String,
    },
    privacy_policy: {
      type: String,
    },
    return_policy: {
      type: String,
    },
    shipping_policy: {
      type: String,
    },
    terms_conditions: {
      type: String,
    },
    payment_policy: {
      type: String,
    },
    about_us: {
      type: String,
    },
    online_payment: {
      type: Number,
      default: 1, // 0->unselected  1->selected
    },
    cash_on_delivery: {
      type: Number,
      default: 1, // 0->unselected  1->selected
    },
    settle_offline: {
      type: Number,
      default: 1, //0->unselected  1->selected
    },
    currency: {
      type: String,
      default: "INR",
    },
    set_tax_rate: {
      type: Number,
    },
    gst_number: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", settingSchema);
