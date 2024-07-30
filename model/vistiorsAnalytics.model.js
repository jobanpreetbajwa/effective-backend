const mongoose = require("mongoose");

const visitorsSchema = new mongoose.Schema(
  {
    user_type: {
      type: Number, //0-uinque  1->reduntant
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VisitorAnalytic", visitorsSchema);
