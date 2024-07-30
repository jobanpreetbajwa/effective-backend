const {
  getSubCategories,
  getSubCategoryByCategory,
} = require("../services/category.service");
const ProductCategory = require("../model/product_category.model");
let SubcategoryModel = require("../model/subcategory.model");
const ErrorHandler = require("../utils/errorHandler");

async function addSubCategory(name, category_id) {
  let subcategories = await getSubCategories();
  for (let sub of subcategories) {
    if (sub.name === name) {
      let productCat = new ProductCategory({
        product: null,
        category: category_id,
        subCategory: sub._id,
      });
      await productCat.save();
      return sub;
    }
  }
  let subCategory = new SubcategoryModel({
    name,
  });
  let productCat = new ProductCategory({
    product: null,
    category: category_id,
    subCategory,
  });
  subCategory = await subCategory.save();
  await productCat.save();
  return subCategory;
}
async function addMulSubCategory(names, category_id) {
  names = JSON.parse(names);
  let subcategories = await getSubCategoryByCategory(category_id);
  let add = [];
  let addProductCategory = [];
  let subNames = subcategories.map(({ name }) => name);
  for (let name of names) {
    if (subNames.includes(name)) {
      continue;
    }
    let subCategory = new SubcategoryModel({
      name,
    });
    add.push(subCategory);
    addProductCategory.push({
      product: null,
      category: category_id,
      subCategory: subCategory._id,
    });
  }
  let subCategoriesAdded = await SubcategoryModel.insertMany(add);
  addProductCategory = await ProductCategory.insertMany(addProductCategory);
  return { subCategoriesAdded, addProductCategory };
}
async function addNewMulSubCategory(names, category_id) {
  let subcategories = await getSubCategories();
  let add = [];
  let addProductCategory = [];
  let subNames = subcategories.map(({ name }) => name);
  for (let name of names) {
    let subCategory;
    if (!subNames.includes(name)) {
      subCategory = new SubcategoryModel({
        name,
      });
      add.push(subCategory);
    } else {
      subCategory = await SubcategoryModel.findOne({ name });
    }
    addProductCategory.push({
      product: null,
      category: category_id,
      subCategory: subCategory._id,
    });
  }
  let subCategoriesAdded = await SubcategoryModel.insertMany(add);
  addProductCategory = await ProductCategory.insertMany(addProductCategory);
  return { subCategoriesAdded, addProductCategory };
}

async function findSubCategory(name) {
  if (!name) {
    throw new ErrorHandler("MISSING_CREDENTIALS");
  }
  let subCategory = SubcategoryModel.findOne({
    name,
  });
  return subCategory;
}

module.exports = { addSubCategory, addMulSubCategory, addNewMulSubCategory };
