const CategoryModel = require("../model/category.model");
const ProductModel = require("../model/product.model");
const ProductCategoryModel = require("../model/product_category.model");
const ErrorHandler = require("../utils/errorHandler");

const { DeleteFileFromCloudinary } = require("../config/cloudinary");
const SubCategoryModel = require("../model/subcategory.model");
const ImageModel = require("../model/images.model");
const ThemePreviewModel = require("../model/theme_preview.model");
const { default: mongoose } = require("mongoose");
const { getProductsByCategory } = require("../services/category.service");

const Excel = require("exceljs");
const productCategory = require("../model/product_category.model");
const SizeChart = require("../model/sizeChart.model");

async function addProduct(productDetails) {
  const session = await mongoose.startSession();
  session.startTransaction();
  let {
    name,
    description,
    prod_status,
    prod_quantity,
    weight,
    mrp_price,
    discounted_price,
    min_order_quantity,
    max_order_quantity,
    cod,
    inventory_available,
    refund,
    category_id,
    shipping_cost,
    tax_rate,
    variants,
    subcategories,
    variable_price,
    prices,
    img_ids,
    parent_id,
    size,
    color,
    is_pricing,
    srn,
  } = productDetails;
  let products = await ProductCategoryModel.find({
    category: category_id,
    product: { $ne: null },
  }).distinct("product").session(session);

  products = await ProductModel.find({
    _id: { $in: products },
    parent_id: null,
  }).session(session);

  let product = new ProductModel({
    name,
    description,
    prod_status,
    prod_quantity,
    weight,
    mrp_price,
    discounted_price,
    min_order_quantity,
    max_order_quantity,
    inventory_available,
    cod,
    refund,
    shipping_cost,
    tax_rate,
    variants,
    variable_price,
    prices,
    img_ids,
    srn: srn ? srn : products.length + 1,
    parent_id,
    size:null,
    color,
    is_pricing,
  });

  product = await product.save({ session });

    // Create and save size chart if provided,for now dummy sizes added.
  // const sizeChart = {
  //     sizes: [
  //       { size: "M", count: 10 },
  //       { size: "L", count: 5 },
  //     ],
  //   };
  if (size) {

    let sizeObj = new SizeChart({
      product_id: product._id,
      sizes:size,
    });
    await sizeObj.save({ session });
      // Update the product with the sizeObj._id
  product.size = sizeObj._id;
  await product.save({ session });
  }
  let productSubCategories = [];
  if (subcategories) {
    subcategories.map((subCategory) => {
      productSubCategories.push(
        new ProductCategoryModel({
          product: product._id,
          category: category_id,
          subCategory,
        })
      );
    });
    await ProductCategoryModel.insertMany(productSubCategories,{ session });
  }
  let productCat = new ProductCategoryModel({
    product: product._id,
    category: category_id,
  });
  await productCat.save({ session });

  product = await ProductModel.findById(product._id).populate("img_ids").session(session).exec();
  await session.commitTransaction();
  session.endSession();

  return product;
}

async function addBulkProducts(products, category_id) {
  let count = 0;
  products = products.map(
    ({ name, description, mrp_price, img_ids, prod_status, is_pricing }) => {
      count++;
      return new ProductModel({
        name,
        description,
        mrp_price,
        srn: count,
        img_ids,
        parent_id: null,
        prod_status,
        is_pricing,
        prices: [],
      });
    }
  );

  let productCategory = products.map((product) => {
    return new ProductCategoryModel({
      product: product._id,
      category: category_id,
    });
  });
  await ProductModel.insertMany(products);

  await ProductCategoryModel.insertMany(productCategory);

  let productsInCategory = await ProductCategoryModel.find({
    category: category_id,
    product: { $ne: null },
  }).distinct("product");

  let numberOfProducts = await ProductModel.find({
    _id: { $in: productsInCategory },
    parent_id: null,
  });

  await ProductModel.updateMany(
    {
      _id: { $in: products.map(({ _id }) => _id) },
    },
    {
      $inc: { srn: numberOfProducts.length - products.length },
    }
  );

  let response = await ProductModel.find({
    _id: { $in: products.map(({ _id }) => _id) },
  })
    .populate("img_ids")
    .exec();
  return response;
}

async function editProduct(productDetails, productId) {
  let {
    name,
    description,
    prod_status,
    prod_quantity,
    weight,
    mrp_price,
    discounted_price,
    min_order_quantity,
    max_order_quantity,
    cod,
    inventory_available,
    refund,
    shipping_cost,
    tax_rate,
    variants,
    variable_price,
    prices,
    img_ids,
    size,
    deletedSizesIds,
    is_pricing,
  } = productDetails;
  const session = await mongoose.startSession();
  session.startTransaction();

  const productSizeChart = await SizeChart.findOne({ product_id: productId }).session(session);
  
  let sizeObj;

if (productSizeChart) {
  // First, filter out sizes that are in the deletedSizesIds array
  productSizeChart.sizes = productSizeChart.sizes.filter(size => !deletedSizesIds.includes(size._id.toString()));
  // Create a map of existing sizes
  const sizeMap = new Map(productSizeChart.sizes.map(size => [size._id.toString(), size]));

  // Iterate over the size array to update or add sizes
  size.forEach(item => {
    if (item._id) {
      const existingSize = sizeMap.get(item._id.toString());
      if (existingSize) {
        // If found, update the existing entry
        existingSize.count = item.count;
      } else {
        // If not found, add the new entry
        sizeMap.set(item._id.toString(), item);
      }
    } else {
      // If item does not have an _id, add it directly with a new ObjectId
      sizeMap.set(new mongoose.Types.ObjectId().toString(), item);
    }
  });

  // Convert the map back to an array and assign it to productSizeChart.sizes
  productSizeChart.sizes = Array.from(sizeMap.values());

  // Save the updated productSizeChart
  await productSizeChart.save({ session });
}
  else{
    sizeObj = new SizeChart({
      product_id: productId,
      sizes:size,
    });
    // Save the updated productSizeChart
    await sizeObj.save({ session });
  }
  let product = await ProductModel.findByIdAndUpdate(
    productId,
    {
      name,
      description,
      prod_status,
      prod_quantity,
      weight,
      mrp_price,
      discounted_price,
      min_order_quantity,
      max_order_quantity,
      inventory_available,
      cod,
      refund,
      shipping_cost,
      tax_rate,
      variants,
      variable_price,
      prices,
      size: sizeObj._id,
      img_ids,
      is_pricing,
    },
    {
      new: true,
      session: session,
    }
  ).populate("img_ids");

  let { subCategories } = await getSubCategoryByProduct(productId);
  
  await session.commitTransaction();
  session.endSession();
  return { product, subCategories };
}

async function getProductById(productId) {
  let result = await ProductModel.findById(productId).populate("img_ids").populate("size") .populate("offers");
  let variants = await ProductModel.find({
    parent_id: productId,
    deletedAt: null,
  }).populate("img_ids");
  let product = result._doc;
  return { ...product, variants };
}
async function getProductsBySubCategories(subcategories) {}
async function getSubCategoryByProduct(productId) {
  let result = await ProductCategoryModel.find({
    product: productId,
    subCategory: { $ne: null },
  })
    .populate("subCategory")
    .populate("product")
    .exec();
  let subCategories = result.map((row) => row.subCategory);

  subCategories = [...new Set(subCategories)];
  return { subCategories };
}
async function searchProduct(product_name) {
  let categories = await ProductModel.find({
    name: { $regex: new RegExp(`${product_name || ""}`, "i") },
  });
  return categories;
}
async function updateProductStatus(product_id, status) {
  let products = await ProductModel.find(
    {
      $or: [{ _id: product_id }, { parent_id: product_id }],
    },
    { _id: 1 }
  );

  await ProductModel.updateMany(
    { _id: { $in: products.map(({ _id }) => _id) } },
    { prod_status: +status ? true : false }
  );
  return { _id: product_id, prod_status: +status ? true : false };
}

async function searchProductByCategory(category_id, product_name) {
  let products = await ProductCategoryModel.find({
    category: category_id,
    product: { $ne: null },
    subCategory: null,
  }).distinct("product");

  products = await ProductModel.find({
    _id: { $in: products },
    parent_id: null,
    name: { $regex: new RegExp(`${product_name || ""}`, "i") },
  }).populate("img_ids");

  return products;
}

async function delete_Product(product_id, category_id) {
  let product = await ProductModel.findById(product_id);
  if (!product) {
    throw new ErrorHandler("PRODUCT_DO_NOT_EXISTS", 400);
  }

  let variants = await ProductModel.find({
    parent_id: product_id,
  });

  await ThemePreviewModel.updateMany(
    { type: 2 },
    { $pull: { product_ids: product_id } }
  );

  // Delete variants
  await ProductCategoryModel.deleteMany({
    product: { $in: variants.map(({ _id }) => _id) },
  });
  await ProductModel.updateMany(
    { _id: { $in: variants.map(({ _id }) => _id) } },
    { deletedAt: Date.now() }
  );

  // Delete parent product
  await ProductCategoryModel.deleteMany({ product: product_id });
  await ProductModel.findByIdAndUpdate(product_id, { deletedAt: Date.now() });

  // Update srn for remaining products
  let products = await ProductCategoryModel.find({
    category: category_id,
    product: { $ne: null },
  }).distinct("product");

  await ProductModel.updateMany(
    { srn: { $gt: product.srn }, _id: { $in: products } },
    { $inc: { srn: -1 } }
  );

  return product;
}

async function bulk_delete_Product(product_ids, category_id) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const productsToDelete = await ProductModel.find({
      _id: { $in: product_ids },
    })
      .select("_id srn")
      .session(session);

    if (!product_ids || product_ids.length === 0) {
      throw new ErrorHandler("NO_PRODUCTS_TO_DELETE");
    }

    let variants = await ProductModel.find({
      parent_id: { $in: product_ids },
    }).session(session);

    await ThemePreviewModel.updateMany(
      { type: 2 },
      { $pull: { product_ids: { $in: product_ids } } }
    ).session(session);

    // Delete variants
    await ProductCategoryModel.deleteMany({
      product: { $in: variants.map(({ _id }) => _id) },
    }).session(session);
    await ProductModel.updateMany(
      { _id: { $in: variants.map(({ _id }) => _id) } },
      { deletedAt: Date.now() }
    ).session(session);

    // Delete parent product
    await ProductCategoryModel.deleteMany({
      product: { $in: product_ids },
      category: category_id,
    }).session(session);
    await ProductModel.updateMany(
      { _id: { $in: product_ids } },
      { deletedAt: Date.now() }
    ).session(session);

    // Update srn for remaining products
    let products = await ProductCategoryModel.find({
      category: category_id,
      product: { $ne: null },
      subCategory: null,
    })
      .distinct("product")
      .session(session);

    productsToDelete.sort((a, b) => b.srn - a.srn);

    for (const { srn } of productsToDelete) {
      await ProductModel.updateMany(
        {
          _id: { $in: products },
          srn: { $gt: srn },
        },
        {
          $inc: { srn: -1 },
        }
      ).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    return await ProductModel.find({ _id: products, parent_id: null }).sort({
      srn: 1,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 112) {
      // WriteConflict
      throw new ErrorHandler("WRITE_CONFLICT", 400);
    } else {
      throw new ErrorHandler(err.message, 400);
    }
  }
}

async function delete_Varients(product_id, category_id) {
  let product = await ProductModel.findByIdAndUpdate(product_id, {
    deletedAt: Date.now(),
  });

  await ProductCategoryModel.deleteMany({ product: product_id });
  return product;
}

async function deleteImage(img_ids, { category_id, product_id }, type) {
  try {
    let images = await ImageModel.find({ _id: { $in: img_ids } });
    let public_ids = [];
    let ids = [];
    for (const image of images) {
      public_ids.push(image.public_id);
      ids.push(image._id);
    }
    //   await DeleteFileFromCloudinary(public_ids, session);

    let update;

    if (category_id) {
      switch (+type) {
        case 1: {
          update = await CategoryModel.findByIdAndUpdate(category_id, {
            $pull: { img_ids: { $in: ids } },
          });
          break;
        }
        case 2: {
          update = await CategoryModel.findByIdAndUpdate(category_id, {
            $pull: { banner_ids: { $in: ids } },
          });
          break;
        }
      }
    }
    if (product_id) {
      switch (+type) {
        case 1: {
          update = await ProductModel.findByIdAndUpdate(product_id, {
            $pull: { img_ids: { $in: ids } },
          });
          break;
        }
      }
    }
    await DeleteFileFromCloudinary(public_ids);
    return update;
  } catch (err) {
    throw new ErrorHandler(err.message, 400);
  }
}

async function reorderProducts(from, to, p_id, category_id) {
  let products = await ProductCategoryModel.find({
    category: category_id,
    product: { $ne: null },
  }).distinct("product");

  if (from > to) {
    const filter = { srn: { $lt: from, $gt: to - 1 }, _id: { $in: products } };
    const update = { $inc: { srn: 1 } };

    await ProductModel.updateMany(filter, update);
    await ProductModel.updateMany(
      { $or: [{ _id: p_id }, { parent_id: p_id }] },
      { $set: { srn: to } }
    );
  } else if (to > from) {
    const filter = { srn: { $gt: from, $lt: to + 1 }, _id: { $in: products } };
    const update = { $inc: { srn: -1 } };

    await ProductModel.updateMany(filter, update);
    await ProductModel.updateMany(
      { $or: [{ _id: p_id }, { parent_id: p_id }] },
      { $set: { srn: to } }
    );
  }

  return await ProductModel.find({
    _id: { $in: products },
    parent_id: null,
  })
    .sort({
      srn: 1,
    })
    .populate("img_ids");
}

async function editBulkProducts(products) {
  const updateOperations = products.map(({ _id, mrp_price }) => ({
    updateOne: {
      filter: { _id },
      update: { mrp_price },
    },
  }));

  // Execute bulk update operation
  const updates = await ProductModel.bulkWrite(updateOperations);

  return updates;
}

async function getProductsExcel(category_id) {
  let data = await getProductsByCategory(category_id);

  let workbook = new Excel.Workbook();
  let worksheet = workbook.addWorksheet("Products");

  worksheet.columns = [
    { header: "Product Name", key: "name", width: 30 },
    { header: "Price", key: "mrp_price", width: 30 },
  ];

  // Add the data to the worksheet
  data.forEach((product, index) => {
    worksheet.addRow({
      name: product.name,
      mrp_price: product.mrp_price,
    });
  });
  return workbook;
}

async function getProductsSampleExcel() {
  let workbook = new Excel.Workbook();
  let worksheet = workbook.addWorksheet("Products");

  worksheet.columns = [
    { header: "Product Name", key: "name", width: 30 },
    { header: "Price", key: "mrp_price", width: 30 },
  ];

  return workbook;
}

async function getProductsByFilters(filters) {
  try{
    console.log(filters)
    const associatedProducts = await productCategory.find({
      subCategory: { $in: filters }
    }).lean();

    const products = await ProductModel.find({
      _id: { $in: associatedProducts.map(({ product }) => product) }
    }).populate('img_ids').lean();

    return products;
    }
    catch(err){
      throw new ErrorHandler(err.message, 400);
    }
}

module.exports = {
  addProduct,
  getProductById,
  getProductsBySubCategories,
  searchProduct,
  delete_Product,
  getSubCategoryByProduct,
  editProduct,
  deleteImage,
  reorderProducts,
  delete_Varients,
  addBulkProducts,
  updateProductStatus,
  bulk_delete_Product,
  searchProductByCategory,
  editBulkProducts,
  getProductsExcel,
  getProductsSampleExcel,
  getProductsByFilters,
};
