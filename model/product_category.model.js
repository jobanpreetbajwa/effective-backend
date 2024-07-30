const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subcategory Schema
const productCategorySchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  subCategory: {
    type: Schema.Types.ObjectId,
    ref: 'SubCategory',
    default: null,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
});

const productCategory = mongoose.model(
  'ProductCategory',
  productCategorySchema
);

module.exports = productCategory;
