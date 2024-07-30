const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Subcategory Schema
const subcategorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

const subCategory = mongoose.model("SubCategory", subcategorySchema);

module.exports = subCategory;
