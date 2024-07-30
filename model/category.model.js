const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Category Schema
const categorySchema = new Schema({
  category_name: {
    type: String,
    required: true,
  },
  img_ids: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Image",
      },
    ],
  },
  banner_ids: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Image",
      },
    ],
  },
  srn: {
    type: Number,
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
