const CategoryModel = require("../model/category.model");
const ProductCategoryModel = require("../model/product_category.model");
const ProductModel = require("../model/product.model");
const SubCategoryModel = require("../model/subcategory.model");
const { default: mongoose } = require("mongoose");

async function addCategory(body, session) {
  let result = await CategoryModel.find();

  let { name, img_ids, banner_ids } = body;

  let category = new CategoryModel({
    category_name: name,
    srn: result.length + 1,
    img_ids: img_ids,
    banner_ids: banner_ids,
  });

  await category.save({ session });

  let temp = await CategoryModel.findById(category._id)
    .lean()
    .populate("img_ids banner_ids")
    .session(session);
  return { ...temp, items: 0 };
}

// input

async function addBulkCategories(categories, session) {
  let result = await CategoryModel.find();
  let count = 0;
  categories = categories.map(({ name, img_ids, banner_ids }) => {
    count++;
    return new CategoryModel({
      category_name: name,
      srn: result.length + count,
      img_ids: img_ids,
      banner_ids: banner_ids,
    });
  });

  await CategoryModel.insertMany(categories, { session });

  let temp = await CategoryModel.find({
    _id: { $in: categories.map(({ _id }) => _id) },
  })
    .sort({ srn: 1 })
    .lean()
    .populate("img_ids banner_ids")
    .session(session);

  temp = temp.map((val) => {
    return { ...val, items: 0 };
  });

  return temp;
}

async function getAllCategories(url, name) {
  let categories = await CategoryModel.aggregate([
    {
      $lookup: {
        from: "productcategories",
        localField: "_id",
        foreignField: "category",
        as: "productcategory",
      },
    },
    {
      $unwind: {
        path: "$productcategory",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "productcategory.subCategory",
        foreignField: "_id",
        as: "subcategories",
      },
    },
    {
      $unwind: {
        path: "$subcategories",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        category_name: { $first: "$category_name" },
        srn: { $first: "$srn" },
        subcategories: {
          $push: {
            _id: "$subcategories._id",
            name: "$subcategories.name",
          },
        },
        img_ids: { $first: "$img_ids" },
        banner_ids: { $first: "$banner_ids" },
      },
    },
    {
      $project: {
        _id: 1,
        category_name: 1,
        category_img: 1,
        srn: 1,
        subcategories: 1,
        img_ids: 1,
        banner_ids: 1,
        items: 1,
      },
    },
  ]).sort({ srn: 1 });
  removeEmptySubcategories(categories);
  categories = await CategoryModel.populate(categories, {
    path: "img_ids banner_ids",
  });
  if (!categories.length) {
    return [];
  }
  let products = await ProductModel.find({ parent_id: null }).lean();
  products = await ProductCategoryModel.find({
    category: { $in: categories.map(({ _id }) => _id) },
    product: { $in: products.map(({ _id }) => _id) },
    subCategory: null,
  }).lean();

  categories = categories.map((val) => {
    const product = products.filter(
      ({ category }) => category.toString() === val._id.toString()
    );
    return { ...val, items: product.length };
  });

  return { categories };
}

function removeEmptySubcategories(categories) {
  return categories.map((category) => {
    category.subcategories = category.subcategories.filter(
      (subcategory) => Object.keys(subcategory).length !== 0
    );
    category.subcategories = Array.from(
      new Set(category.subcategories.map(JSON.stringify))
    ).map(JSON.parse);
    return category;
  });
}

async function getProductsByCategory(category_id) {
  let parentProducts = await ProductCategoryModel.find({
    category: category_id,
  }).distinct("product");

  parentProducts = await ProductModel.find({
    _id: { $in: parentProducts },
    parent_id: null,
  }).populate("img_ids");

  let allVariants = await ProductModel.find({
    parent_id: { $in: parentProducts.map((p) => p._id) },
  }).populate("img_ids");

  const productsWithSubproducts = parentProducts.map((parentProduct) => {
    const subproducts = allVariants.filter(
      (variant) => variant.parent_id.toString() === parentProduct._id.toString()
    );
    let parent = parentProduct.toObject();
    return { ...parent, variants: subproducts };
  });

  productsWithSubproducts.sort((a, b) => a.srn - b.srn);

  return productsWithSubproducts;
}

async function getProductsLimitByCategory(category_id, limit, page) {
  // Fetch parent products based on category_id
  let parentProducts = await ProductCategoryModel.find({
    category: category_id,
  }).distinct("product");

  // Fetch parent products details and populate necessary fields
  parentProducts = await ProductModel.find({
    _id: { $in: parentProducts },
    parent_id: null,
  })
    .populate("img_ids")
    .populate("size")
    .populate("offers")
    .sort({ srn: 1 });

  // Fetch all variants of the parent products
  let allVariants = await ProductModel.find({
    parent_id: { $in: parentProducts.map((p) => p._id) },
  })
    .populate("img_ids")
    .populate("offers");

  // Combine parent products with their variants
  const productsWithSubproducts = parentProducts.map((parentProduct) => {
    const subproducts = allVariants.filter(
      (variant) => variant.parent_id.toString() === parentProduct._id.toString()
    );
    let parent = parentProduct.toObject();
    return { ...parent, variants: subproducts };
  });

  // Sort products by srn
  productsWithSubproducts.sort((a, b) => a.srn - b.srn);

  // Apply pagination if limit and page are provided
  if (limit && page) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    return productsWithSubproducts.slice(startIndex, endIndex);
  }

  return productsWithSubproducts;
}

async function getSubCategoryByCategory(category_id) {
  let subCategories = await ProductCategoryModel.find({
    category: category_id,
  }).distinct("subCategory");

  subCategories = await SubCategoryModel.find({ _id: { $in: subCategories } });
  return subCategories;
}

async function getSubCategories() {
  let subCategories = await SubCategoryModel.find();
  return subCategories;
}

async function searchCategory(category_name) {
  let categories = await CategoryModel.find({
    category_name: { $regex: new RegExp(`${category_name || ""}`, "i") },
  })
    .populate("img_ids banner_ids")
    .lean();

  let subCategories = await ProductCategoryModel.find({
    category: { $in: categories.map(({ _id }) => _id) },
    subCategory: { $ne: null },
  }).populate("subCategory");

  categories = categories.map((val) => {
    let obj = subCategories.filter(
      ({ category }) => val._id.toString() === category.toString()
    );

    let uniqueSubcategories = {};
    obj.forEach((subCat) => {
      uniqueSubcategories[subCat.subCategory._id.toString()] =
        subCat.subCategory;
    });

    return { ...val, subcategories: Object.values(uniqueSubcategories) };
  });
  //console.log("subca===>", obj);

  return categories;
}

async function findCategory(category_name) {
  let category = await CategoryModel.findOne({
    category_name,
  }).populate("img_ids banner_ids");
  return category;
}

async function findCategories(category_names) {
  let category = await CategoryModel.find({
    category_name: {
      $in: category_names.map((category_name) => category_name),
    },
  }).populate("img_ids banner_ids");
  return category;
}

async function getProductsBySubCategories(category_id, subCategories) {
  const subCategoryIds = subCategories.map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  let products = await ProductCategoryModel.find({
    category: category_id,
    subCategory: { $in: subCategoryIds },
  }).distinct("product");
  products = await ProductModel.find({ _id: { $in: products } }).populate(
    "img_ids"
  );
  return products;
}

async function reorderCategories(from, to, _id, session) {
  if (from > to) {
    const filter = { srn: { $lt: from, $gt: to - 1 } };
    const update = { $inc: { srn: 1 } };

    const result = await CategoryModel.updateMany(filter, update).session(
      session
    );
    await CategoryModel.updateOne({ _id }, { $set: { srn: to } }).session(
      session
    );
  } else if (to > from) {
    const filter = { srn: { $gt: from, $lt: to + 1 } };
    const update = { $inc: { srn: -1 } };

    const result = await CategoryModel.updateMany(filter, update).session(
      session
    );
    await CategoryModel.updateOne({ _id }, { $set: { srn: to } }).session(
      session
    );
  }

  return await CategoryModel.find().sort({ srn: 1 });
}

async function filter_products_by_subcategories(
  category_id,
  subCategories,
  page,
  limit
) {
  let Allproduct = [];

  const subCategoryIds = subCategories.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  let products = await ProductCategoryModel.find({
    category: category_id,
    product: { $ne: null },
    subCategory: { $in: subCategoryIds },
  }).distinct("product");

  let totalProducts = await ProductModel.countDocuments({
    _id: { $in: products },
    prod_status: true,
    deletedAt: null,
  });

  const skip = (+page - 1) * +limit;

  let All_product = await ProductModel.find({
    _id: { $in: products },
    prod_status: true,
    deletedAt: null,
  })
    .populate("img_ids")
    .sort({ srn: 1 })
    .skip(skip)
    .limit(+limit)
    .lean()
    .select("-variants");

  for (let product of All_product) {
    Allproduct.push(product);
  }

  return {
    products: Allproduct,
    totalProducts,
  };
}

module.exports = {
  addCategory,
  getProductsByCategory,
  getSubCategoryByCategory,
  searchCategory,
  findCategory,
  getAllCategories,
  getProductsBySubCategories,
  reorderCategories,
  findCategories,
  addBulkCategories,
  getSubCategories,
  getProductsLimitByCategory,
  filter_products_by_subcategories,
};
