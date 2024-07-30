const mongoose = require("mongoose");

const viewsSchema = new mongoose.Schema(
  {
    user_type: {
      type: Number, // 0->unique  1->reduntant
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ViewsAnalytic", viewsSchema);
