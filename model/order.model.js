const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    date: {
      type: Date,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        size:{
          type: mongoose.Schema.Types.ObjectId,
          ref:"SizeChart"
        },
        price: Number,
      },
    ],
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pin: {
      type: Number,
    },
    deliveryAddress: {
      type: String,
    },
    status: {
      type: Number,
      default: 0, // 0->pending 1->delivered 2->cancelled 3->shipped 4->returned 5->inProgress
    },
    paymentMode: {
      type: Number, //0->cod 1->online 2->credit payments
    },
    user_note: {
      type: String,
    },
    // showSummary: {
    //   type: Boolean,
    //   default: false,
    // },
    admin_note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
