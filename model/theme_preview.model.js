const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const themePreviewSchema = new Schema({
  srn: {
    type: Number,
  },
  hidden: {
    type: Boolean,
    default: false,
  },
  type: {
    type: Number, //1: catelogue 2:product collection 3: slideshow 4: taglines
  },
  title: {
    type: String,
  },
  product_ids: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  category_ids: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  slideshow: {
    type: [
      {
        img_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Image",
        },
        category_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      },
    ],
  },
  tagline: {
    type: String,
  },
  reviews: {
    type: [Object],
  },
  main: {
    type: Boolean,
    default: false,
  },
});

const ThemePreview = mongoose.model("ThemePreview", themePreviewSchema);

module.exports = ThemePreview;
