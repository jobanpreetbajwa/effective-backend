const UserModel = require("../model/user.model");
const CategoryModel = require("../model/category.model");
const SubCategoryModel = require("../model/subcategory.model");
const ProductModel = require("../model/product.model");
const ProductCategoryModel = require("../model/product_category.model");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const ReviewModel = require("../model/rating.model");
const generateOrderId = require("../utils/generateToken");
const OrderModel = require("../model/order.model");
const RatingModel = require("../model/rating.model");
const ThemePreviewModel = require("../model/theme_preview.model");
const Coupon = require("../model/coupon.model");
const Offers = require("../model/offers.model");
const axios = require("axios");
const moment = require("moment");

const { orderPriceCalculate, getGlobalSummary } = require("./admin.service");

async function verifyUser(phoneNumber) {
  if (!phoneNumber) {
    throw new ErrorHandler("PHONENUMBER_MISSING", 400);
  }
  const checkNumber = await UserModel.findOne({ phoneNumber });
  if (!checkNumber) {
    throw new ErrorHandler("user:null", 200);
  }

  return checkNumber;
}

async function averageRating(product_id) {
  let averageRating = await ReviewModel.calculateAverageRating(product_id);
  return averageRating;
}

async function getSubCategoryByCategory(category_id) {
  let subCategories = await ProductCategoryModel.find({
    category: category_id,
  }).distinct("subCategory");
  subCategories = await SubCategoryModel.find({
    _id: { $in: subCategories },
  });
  let category = await CategoryModel.findById(category_id).populate(
    "img_ids banner_ids"
  );

  return { category, subCategories };
}

async function searchCategory(name) {
  let all_category = await CategoryModel.find({
    category_name: { $regex: new RegExp(`${name || ""}`, "i") },
  }).populate("img_ids banner_ids");

  return all_category;
}
async function getproducts_ByName(name) {
  let categoryFilter = {};
  let SuggestedProducts = [];
  let Products = [];

  if (name) {
    categoryFilter.product_name = { $regex: new RegExp(`${name}`, "i") };
  }

  let productsData = await ProductModel.find({
    name: categoryFilter.product_name,
    prod_status: true,
    deletedAt: null,
  })
    .select("-variants")
    .lean()
    .populate("img_ids");

  for (let product of productsData) {
    const avgRating = await averageRating(product._id);
    // product = product.toObject();
    product.avgRating = avgRating;
    Products.push(product);
  }
  if (productsData.length === 0) {
    return { SuggestedProducts };
  }
  return { Products, SuggestedProducts };
}

async function productDetails(product_id) {
  let relatedProducts = [];

  if (!product_id) {
    throw new ErrorHandler("ID_MISSING", 400);
  }
  const product = await ProductModel.findById(product_id)
    .populate("img_ids")
    .select("-variants")
    .lean();

  const avgRating = await averageRating(product._id);
  product.avgRating = avgRating;

  if (!product) {
    throw new ErrorHandler("PRODUCT NOT FOUND", 400);
  }

  const category = await ProductCategoryModel.findOne({ product: product_id });

  const allProducts = await ProductCategoryModel.find({
    category: category.category,
    product: { $ne: product_id },
  }).distinct("product");

  let relatedProduct = await ProductModel.find({
    _id: { $in: allProducts },
    prod_status: true,
    deletedAt: null,
  })
    .lean()
    .populate("img_ids")
    .sort({ srn: 1 })
    .select("-variants");

  for (let products of relatedProduct) {
    const avgRating = await averageRating(products._id);
    // product = product.toObject();
    products.avgRating = avgRating;
    relatedProducts.push(products);
  }

  return { product, relatedProducts };
}

async function product_ratings(user_id, product_id, reviews) {
  if (!user_id || !product_id || !reviews) {
    throw new ErrorHandler("MISSING_CREDINTIALS", 400);
  }

  const review = new ReviewModel({
    user_id,
    product_id,
    reviews,
  });

  await review.save();
  return review;
}

async function getProductsByCategory(category_id, page, limit) {
  let products = [];
  let metadata = {};
  // let totalProducts = await ProductCategoryModel.find({
  //   category: category_id,
  //   product: { $ne: null },
  // }).distinct("product");

  let productIds = await ProductCategoryModel.find({
    category: category_id,
    product: { $ne: null },
  }).distinct("product");

  const totalProducts = productIds.length;
  const totalPages = Math.ceil(totalProducts / limit);
  const skip = (page - 1) * limit;
  metadata.totalProducts = totalProducts;
  metadata.totalPages = totalPages;
  metadata.currentPage = page;

  let Product = await ProductModel.find({
    _id: { $in: productIds },
    prod_status: true,
    deletedAt: null,
  })
    .populate("img_ids")
    .sort({ srn: 1 })
    .lean()
    .select("-variants")
    .skip(skip)
    .limit(limit);

  for (let product of Product) {
    const avgRating = await averageRating(product._id);
    product.avgRating = avgRating;
    products.push(product);
  }

  return {
    metadata,
    products,
  };
}

async function getProductsBySubCategories(
  category_id,
  subCategories,
  page,
  limit
) {
  let Allproduct = [];
  let metadata = {};

  const subCategoryIds = subCategories.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  let products = await ProductCategoryModel.find({
    category: category_id,
    subCategory: { $in: subCategoryIds },
    product: { $ne: null },
  }).distinct("product");

  let totalProducts = await ProductModel.countDocuments({
    _id: { $in: products },
    prod_status: true,
    deletedAt: null,
  });

  const totalPages = Math.ceil(totalProducts / limit);
  const skip = (page - 1) * limit;
  metadata.totalProducts = totalProducts;
  metadata.totalPages = totalPages;
  metadata.currentPage = page;

  let All_product = await ProductModel.find({
    _id: { $in: products },
    prod_status: true,
    deletedAt: null,
  })
    .populate("img_ids")
    .sort({ srn: 1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .select("-variants");

  for (let product of All_product) {
    const avgRating = await averageRating(product._id);
    product.avgRating = avgRating;
    Allproduct.push(product);
  }

  return {
    metadata,
    products: Allproduct,
  };
}

async function placeOrder(
  user_id,
  date,
  items,
  deliveryAddress,
  user_note,
  paymentMode,
  name,
  phoneNumber,
  city,
  state,
  pin,
  subTotal,
  appliedCoupon
) {
  if (!user_id || !date || !items || !deliveryAddress || !phoneNumber) {
    throw new ErrorHandler("CREDINTIALS_MISSING", 400);
  }

  let total = subTotal;
  // Adjust total based on offers
  for (const item of items) {
    if (item.offers && item.offers.length > 0) {
      const offer = item.offers[0];
      if (offer.type === 'percentage') {
        const offerDetails = await Offers.findById(offer._id);
        if (offerDetails) {
          const discount = (item.price * offerDetails.discountPercent) / 100;
          const finalDiscount = Math.min(discount, offerDetails.discountUpto);
          if (total >= offerDetails.minOrderValue) {
            total -= finalDiscount;
          }
        }
      }
    }
  }


  // Check if the applied coupon is valid
  if (appliedCoupon) {
    const coupon = await Coupon.findById(appliedCoupon);
    if (!coupon) {
      throw new ErrorHandler("INVALID_COUPON", 400);
    }
    if (!coupon.is_active) {
      throw new ErrorHandler("COUPON_INACTIVE", 400);
    }
    if (new Date(coupon.expiry_date) < new Date()) {
      throw new ErrorHandler("COUPON_EXPIRED", 400);
    }
    // Adjust total based on coupon
    if (total >= coupon.minimum_order_value) {
      let couponDiscount = 0;
      if (coupon.discount_type === 'percentage') {
        couponDiscount = (total * coupon.discount_percentage) / 100;
      } else if (coupon.discount_type === 'value') {
        couponDiscount = coupon.discount_value;
      }
      const finalCouponDiscount = Math.min(couponDiscount, coupon.discount_upto);
      total -= finalCouponDiscount;
      }
  }

const order_id = await generateOrderId.generateOrderId();
let order = new OrderModel({
    orderId: order_id,
    customerId: user_id,
    date,
    name,
    phoneNumber,
    items,
    deliveryAddress,
    city,
    state,
    pin,
    user_note,
    paymentMode,
    subTotal:total,
    ...(appliedCoupon && { appliedCoupon }), // Add appliedCoupon only if it is not null
  });
  await order.save();

  const productIds = order.items.map((item) => item.productId);

  const products = await ProductModel.find({
    _id: { $in: productIds },
    inventory_available: true, //limited quantity
  });

  for (const product of products) {
    const correspondingItem = order.items.find((item) =>
      item.productId.equals(product._id)
    );

    if (correspondingItem) {
      product.prod_quantity -= correspondingItem.quantity;
      await product.save();
    }
  }
  const ratings = await RatingModel.find({
    user_id,
    product_id: { $in: items.map(({ productId }) => productId) },
  });

  order = order.toJSON();
  items = order.items.map((item) => {
    let rating = ratings.filter(
      ({ product_id }) => product_id.toString() === item.productId.toString()
    );
    return {
      ...item,
      rating: rating?.[0] ? rating?.[0].rating : 0,
    };
  });

    const response = await UserModel.findOne({ _id: user_id });
    if (response) {
      response.name = name;
      response.phoneNumber = phoneNumber;
      response.address = deliveryAddress;
    }
    await response.save();
  return { 
    message: {
      success: true,
      message: "Order placed successfully",
      order: { ...order, items }
    }
  };
}

async function orderHistory(user_id) {
  if (!user_id) {
    throw new ErrorHandler("CREDINTIALS_MISSING", 400);
  }
  const orders = await OrderModel.find({
    customerId: user_id,
  })
    .lean()
    .populate("items.productId")
    .sort({ createdAt: -1 });

  response = orders.map((order) => {
    let totalAmount = 0;
    // order.items = order.items.filter(
    //   (item) =>
    //     item?.productId &&
    //     !(item?.productId.deletedAt && [0, 2, 4, 5].includes(order.status))
    // );
    order.items.map((item) => {

      const { quantity} = item;
      totalAmount += item?.productId?.mrp_price * quantity;
      item.productId = item?.productId?._id || undefined;  
    });
    return { ...order, totalAmount };
  });

  return response;
}

async function orderDetails(user_id, order_id) {
  if (!user_id) {
    throw new ErrorHandler("CREDINTIALS_MISSING", 400);
  }
  const order = await OrderModel.findOne({orderId:order_id})
    .lean()
    .populate("items.productId")
    .populate({
      path: "items.productId",
      populate: {
        path: "img_ids",
        model: "Image",
      },
    });

  let products = [];

  for (const item of order.items) {
    // if (
    //   item?.productId &&
    //   !(item?.productId.deletedAt && [0, 2, 4, 5].includes(order.status))
    // ) {
    products.push(item?.productId?._id);
    // }
  }

  const ratings = await RatingModel.find({
    user_id,
    product_id: { $in: products },
  });

  let totalAmount = 0;
  // order.items = order.items.filter(
  //   (item) =>
  //     item?.productId &&
  //     !(item?.productId.deletedAt && [0, 2, 4, 5].includes(order.status))
  // );
  let items = order.items.map((item) => {
    let rating = ratings.filter((rate) => {
      return rate?.product_id.toString() === item?.productId?._id.toString();
    });
    const { quantity, price } = item;
    totalAmount += price * quantity;
    item.productId = item?.productId || undefined;
    return {
      ...item,
      rating: rating?.[0] ? rating?.[0].rating : 0,
    };
  });

  let { globalShowSummary } = await getGlobalSummary();
  return { ...order, items, totalAmount, globalShowSummary };
}

async function getUserThemePreviews(_id) {
  let preview = await ThemePreviewModel.findOne({ _id })
    .populate("category_ids product_ids category_ids.banner_ids")
    .populate({
      path: "slideshow",
      populate: {
        path: "img_id",
      },
    })
    .populate({
      path: "product_ids",
      populate: {
        path: "img_ids",
      },
    })
    .populate({
      path: "category_ids",
      populate: {
        path: "img_ids banner_ids",
      },
    })
    .lean();

  if (preview.type === 2) {
    preview.product_ids = preview.product_ids.filter(
      (product) => product.prod_status !== false
    );
  }

  let totalThemes = await ThemePreviewModel.countDocuments();
  if (!preview) {
    throw new ErrorHandler("PREVIEW_NOT_FOUND", 400);
  }
  return { ...preview, totalThemes };
}

async function getUserTheme() {
  let preview = await ThemePreviewModel.find({ hidden: false }).sort({
    srn: 1,
  });
  //.select("type title srn _id product_ids ");
  if (!preview) {
    throw new ErrorHandler("PREVIEW_NOT_FOUND", 400);
  }
  return preview;
}

async function views() {
  return response;
}

module.exports = {
  verifyUser,
  getSubCategoryByCategory,
  searchCategory,
  getproducts_ByName,
  productDetails,
  product_ratings,
  getProductsByCategory,
  getProductsBySubCategories,
  averageRating,
  placeOrder,
  orderHistory,
  orderDetails,
  getUserThemePreviews,
  getUserTheme,
  views,
};
