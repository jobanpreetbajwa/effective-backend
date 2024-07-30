const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    rating: {
      type: Number,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ratingSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    {
      $match: {
        product_id: new mongoose.Types.ObjectId(productId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: { $toDecimal: "$rating" } },
      },
    },
  ]);

  // If there are no ratings, return 0 as the average
  if (result.length === 0 || !result[0].avgRating) {
    return 0;
  }

  return parseFloat(result[0].avgRating.toString());
};
module.exports = mongoose.model("Rating", ratingSchema);
