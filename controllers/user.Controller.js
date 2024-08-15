const {
  verifyUser,
  getSubCategoryByCategory,
  getproducts_ByName,
  productDetails,
  getProductsByCategory,
  getProductsBySubCategories,
  averageRating,
  placeOrder,
  orderHistory,
  orderDetails,
  getUserThemePreviews,
  getUserTheme,
} = require("../services/user.service");
const generateToken = require("../utils/generateToken");
const CategoryModel = require("../model/category.model");
const ProductModel = require("../model/product.model");
const ErrorHandler = require("../utils/errorHandler");
const RatingModel = require("../model/rating.model");
const VisitorSchema = require("../model/vistiorsAnalytics.model");
const mongoose = require("mongoose");
const ProductCategoryModel = require("../model/product_category.model");
const ViewsSchema = require("../model/viewsAnalytics.model");
const axios = require("axios");
const csvtojson = require("csvtojson");
const moment = require("moment");
const fs = require("fs");

class UserController {
  /**
   * Controller function to add a new category.
   * This function handles the request to add a new category and ensures proper transaction management.
   *
   * @param {Object} req - The request object, containing the request body with category details.
   * @param {Object} res - The response object used to send the response back to the client.
   *
   * @returns {Promise<void>} - Returns a response with the added category or an error message.
   */
  async loginUser(req, res) {
    try {
      const { phoneNumber } = req.body;
      const user = await verifyUser(phoneNumber);
      if (user) {
        const token = await generateToken.generatedeviceToken(
          // generatedevicetoken is a utility which  will generate token
          {
            _id: user._id,
            user_name: user.user_name,
          },
          process.env.JWT_SECRET
        );

        return res.status(200).json({ token, user });
      }
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async category_list(req, res) {
    try {
      let all_categories = await CategoryModel.find()
        .lean()
        .populate("img_ids banner_ids") //find all the categories and sort on the basis of serial number
        .sort({ srn: 1 });

      for (const category of all_categories) {
        const totalProducts = await ProductCategoryModel.countDocuments({
          //this will count all the products of related category
          category: category._id,
          product: { $ne: null },
          subCategory: null,
        });
        category.totalProducts = totalProducts;
      }

      if (!all_categories) {
        throw new ErrorHandler("NO_CATEGORY_IS_PRESENT", 400);
      }
      return res.status(200).json(all_categories);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getSubCategoryByCategory(req, res) {
    try {
      let { category_id } = req.params;

      let data = await getSubCategoryByCategory(category_id);

      res.status(200).json({ data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async searchProduct_byCategoryName(req, res) {
    try {
      const { name } = req.body;
      let products = await getproducts_ByName(name);
      res.status(200).json(products);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async product_details(req, res) {
    try {
      const { product_id } = req.params;
      let product = await productDetails(product_id);
      return res.status(200).json(product);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getProductsByCategory(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let { category_id } = req.params;
      let { page, limit } = req.body;

      page = parseInt(page) || 1;
      limit = parseInt(limit) || 12;

      let products = await getProductsByCategory(category_id, page, limit);
      let subcategories = await getSubCategoryByCategory(category_id);

      res.status(200).json({ ...products, subcategories });
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async getProductsBySubCategories(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let { category_id } = req.params;
      let { subcategories, page, limit } = req.body;
      if (!category_id) {
        throw new ErrorHandler("CATEGORY_ID_MISSING", 400);
      }

      page = parseInt(page) || 1;
      limit = parseInt(limit) || 12;

      let products = await getProductsBySubCategories(
        category_id,
        subcategories,
        page,
        limit
      );

      res.status(200).json(products);
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async addRating(req, res) {
    try {
      const { user_id, product_id } = req.params;
      const { reviews } = req.body;

      if (!user_id || !product_id) {
        throw new ErrorHandler("CREDENTIALS_MISSING", 400);
      }

      const rating = new RatingModel({
        // rating of that product has been added to ratingModel
        user_id,
        product_id,
        rating: reviews,
      });

      await rating.save();

      const ratingAverage = await averageRating(product_id); // in return average rating of that product is been returned

      return res.status(200).json({ ratingAverage });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateRating(req, res) {
    try {
      const { user_id, product_id } = req.params;
      let { rating } = req.body;

      const existingRating = await RatingModel.findOne({ user_id, product_id }); //in this if ratings is given by user then if he want to update that rating it can other wise new entry will be created

      let updated_rating;
      let avgRating;

      if (existingRating) {
        updated_rating = await RatingModel.findOneAndUpdate(
          { user_id, product_id },
          { rating },
          { new: true }
        );
      } else {
        const updated_ratings = new RatingModel({
          user_id,
          product_id,
          rating,
        });
        await updated_ratings.save();
      }

      avgRating = await averageRating(product_id); //in return aaverage rating is being returned

      return res.status(200).json({ avgRating });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getRatings(req, res) {
    try {
      const { user_id, product_id } = req.params;
      const getRating = await RatingModel.findOne({ user_id, product_id }); //to get rating
      return res.status(200).json(getRating);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async placeOrder(req, res) {
    try {
      const { user_id } = req.params;
      const {
        deliveryAddress,
        note,
        name,
        phoneNumber,
        city,
        state,
        pin,
      } = req.body.orderDetails;
      const cartItems = req.body.cartItems;
      const items = cartItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity
      }));
      const date = new Date();
      const paymentMode = 1;
    
      const place_order = await placeOrder(
        user_id,
        date,
        items,
        deliveryAddress,
        note,
        paymentMode,
        name,
        phoneNumber,
        city,
        state,
        pin
      );
      return res.status(200).json(place_order);
    } catch (err) {
      return res.status(err.status || 500).json({ message:{
        success: false,
        message: err.message
      } });
    }
  }

  async orderHistory(req, res) {
    try {
      const { user_id } = req.params;
      const orders = await orderHistory(user_id);
      res.status(200).json(orders);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async orderDetails(req, res) {
    try {
      const { user_id, order_id } = req.params;
      const orders = await orderDetails(user_id, order_id);
      res.status(200).json(orders);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getUserThemePreviews(req, res, next) {
    try {
      const { _id } = req.params;
      const themePreviews = await getUserThemePreviews(_id);
      res.json(themePreviews);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getUserTheme(req, res, next) {
    try {
      const themePreviews = await getUserTheme();
      res.json(themePreviews);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  // async getviews(req, res) {
  //   try {
  //     const { type, cdate } = req.params;
  //     const username = "acc2.7cc4b7.mp-service-account";
  //     const password = "sH0hAiP9K9K749uLVdgRlXQML77nA050";
  //     const authString = Buffer.from(`${username}:${password}`).toString(
  //       "base64"
  //     );
  //     const project_id = 3304088;
  //     switch (+type) {
  //       case 0:
  //         const startDate = moment(cdate).startOf("day");
  //         console.log(startDate);

  //         const endDate = startDate
  //           .clone()
  //           .endOf("day")
  //           .hour(23)
  //           .minute(59)
  //           .second(59);

  //         const fetchDatatoday = async (projectId, fromDate, toDate) => {
  //           const response = await axios.get(
  //             `https://data.mixpanel.com/api/2.0/export/?project_id=${projectId}&expire=3600&from_date=${fromDate.format(
  //               "YYYY-MM-DD"
  //             )}&to_date=${toDate.format(
  //               "YYYY-MM-DD"
  //             )}&event=[%22siteVisited-unique%22]&format=json`,
  //             {
  //               headers: {
  //                 Authorization: `Basic ${authString}`,
  //                 accept: "application/json",
  //               },
  //             }
  //           );

  //           // const jsonData = await csvtojson().fromString(response.data);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   timeStamp: item.timeStamp,
  //           //   event: item.event,
  //           // }));
  //           //const jsonString = JSON.stringify(response.data);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   firstKey: Object.keys(item)[0],
  //           //   firstValue: Object.values(item)[0],
  //           //   field31: item.field31,
  //           // }));

  //           // return formattedData;
  //           console.log("unique======>", response.data.split("\n"));
  //           const jsonArray = response.data.split("\n");
  //           console.log("parse==========>", JSON.parse(jsonArray[0]));

  //           // console.log("hloooo=====", jsonArray);

  //           return jsonArray;
  //         };

  //         const fetchDatatodayredun = async (projectId, fromDate, toDate) => {
  //           const response = await axios.get(
  //             `https://data.mixpanel.com/api/2.0/export/?project_id=${projectId}&expire=3600&from_date=${fromDate.format(
  //               "YYYY-MM-DD"
  //             )}&to_date=${toDate.format(
  //               "YYYY-MM-DD"
  //             )}&event=[%22siteVisited-redundant%22]&format=json`,
  //             // /events?type=general&unit=minute&format=json'
  //             {
  //               headers: {
  //                 Authorization: `Basic ${authString}`,
  //                 accept: "application/json",
  //               },
  //             }
  //           );
  //           // const jsonData = await csvtojson().fromString(response.data);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   timeStamp: item.timeStamp,
  //           //   event: item.event,
  //           // }));

  //           // const formattedData = jsonData.map((item) => ({
  //           //   firstKey: Object.keys(item)[0],
  //           //   firstValue: Object.values(item)[0],
  //           //   field31: item.field31,
  //           // }));

  //           // return formattedData;
  //           // let cleanedData = response.data.replace(/\\/g, "");
  //           // cleanedData = cleanedData.replace("\\n", "");
  //           // console.log(cleanedData);

  //           // Parse the cleaned data to JSON
  //           // const jsonData = JSON.parse(cleanedData);
  //           // console.log("jhvjhbjhbjhb=====>", Object.keys(response.data));
  //           return response.data;
  //         };
  //         const uniquedata = await fetchDatatoday(
  //           project_id,
  //           startDate,
  //           endDate
  //         );
  //         // console.log(
  //         //   "uniquedata---=================>",
  //         //   Object.keys(uniquedata)
  //         // );
  //         // console.log("uniquedata---=================>", uniquedata);
  //         //    const uniqueparsed = JSON.parse(uniquedata);
  //         // console.log(typeof parsed);
  //         const reduntantdata = await fetchDatatodayredun(
  //           project_id,
  //           startDate,
  //           endDate
  //         );

  //         // const reduntantparsed = JSON.parse(reduntantdata);
  //         return res.status(200).json({ uniquedata });

  //       case 1:
  //         const currentDate = moment(cdate).startOf("day");

  //         const dayOfWeek = currentDate.day();
  //         const startOfWeek = currentDate.clone().startOf("week");

  //         const endOfDay = currentDate
  //           .clone()
  //           .endOf("day")
  //           .hour(23)
  //           .minute(59)
  //           .second(59);
  //         const fetchDataweekly = async (projectId, fromDate, toDate) => {
  //           const response = await axios.get(
  //             `https://data.mixpanel.com/api/2.0/export/?project_id=${projectId}&expire=3600&from_date=${fromDate.format(
  //               "YYYY-MM-DD"
  //             )}&to_date=${toDate.format(
  //               "YYYY-MM-DD"
  //             )}&event=[%22siteVisited-redundant%22]`,
  //             {
  //               headers: {
  //                 Authorization: `Basic ${authString}`,
  //               },
  //             }
  //           );
  //           const jsonData = await csvtojson().fromString(response.data);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   timeStamp: item.timeStamp,
  //           //   event: item.event,
  //           // }));
  //           const jsonString = JSON.stringify(jsonData);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   firstKey: Object.keys(item)[0],
  //           //   firstValue: Object.values(item)[0],
  //           //   field31: item.field31,
  //           // }));

  //           // return formattedData;

  //           return jsonString;
  //         };

  //         const fetchDataweeklyredun = async (projectId, fromDate, toDate) => {
  //           const response = await axios.get(
  //             "https://data.mixpanel.com/api/2.0/export/?project_id=3304088&expire=3600&from_date=2024-05-15&to_date=2024-05-15&event=[%22siteVisited-redundant%22]",
  //             {
  //               headers: {
  //                 Authorization: `Basic ${authString}`,
  //               },
  //             }
  //           );
  //           const jsonData = await csvtojson().fromString(response.data);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   timeStamp: item.timeStamp,
  //           //   event: item.event,
  //           // }));
  //           const jsonString = JSON.stringify(jsonData);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   firstKey: Object.keys(item)[0],
  //           //   firstValue: Object.values(item)[0],
  //           //   field31: item.field31,
  //           // }));

  //           // return formattedData;

  //           return jsonString;
  //         };
  //         const uniqueweeklydata = await fetchDataweekly();
  //         const uniqueweeklyparsed = JSON.parse(uniqueweeklydata);
  //         // console.log(typeof parsed);
  //         const reduntantweeklydata = await fetchDataweeklyredun();
  //         const reduntantweeklyparsed = JSON.parse(reduntantweeklydata);
  //         return res.status(200).json({
  //           unique: uniqueweeklyparsed,
  //           reduntant: reduntantweeklyparsed,
  //         });
  //       case 2:
  //         const startOfMonth = new Date(currentYear, month, 1, 0, 0, 0);

  //         const endOfMonth = new Date(currentYear, month + 1, 0, 23, 59, 59);
  //         const fetchDatamonthly = async (projectId, fromDate, toDate) => {
  //           const response = await axios.get(
  //             "https://data.mixpanel.com/api/2.0/export/?project_id=3304088&expire=3600&from_date=2024-05-15&to_date=2024-05-15&event=[%22siteVisited-unique%22]",
  //             {
  //               headers: {
  //                 Authorization: `Basic ${authString}`,
  //               },
  //             }
  //           );
  //           const jsonData = await csvtojson().fromString(response.data);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   timeStamp: item.timeStamp,
  //           //   event: item.event,
  //           // }));
  //           const jsonString = JSON.stringify(jsonData);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   firstKey: Object.keys(item)[0],
  //           //   firstValue: Object.values(item)[0],
  //           //   field31: item.field31,
  //           // }));

  //           // return formattedData;

  //           return jsonString;
  //         };

  //         const fetchDatamonthlyredun = async (projectId, fromDate, toDate) => {
  //           const response = await axios.get(
  //             "https://data.mixpanel.com/api/2.0/export/?project_id=3304088&expire=3600&from_date=2024-05-15&to_date=2024-05-15&event=[%22siteVisited-redundant%22]",
  //             {
  //               headers: {
  //                 Authorization: `Basic ${authString}`,
  //               },
  //             }
  //           );
  //           const jsonData = await csvtojson().fromString(response.data);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   timeStamp: item.timeStamp,
  //           //   event: item.event,
  //           // }));
  //           const jsonString = JSON.stringify(jsonData);

  //           // const formattedData = jsonData.map((item) => ({
  //           //   firstKey: Object.keys(item)[0],
  //           //   firstValue: Object.values(item)[0],
  //           //   field31: item.field31,
  //           // }));

  //           // return formattedData;

  //           return jsonString;
  //         };
  //         const uniquemonthlydata = await fetchDatamonthly();
  //         const uniquemonthlyparsed = JSON.parse(uniquemonthlydata);
  //         //console.log(typeof parsed);
  //         const redunmonthlydata = await fetchDatamonthlyredun();
  //         const redunmonthlyparsed = JSON.parse(redunmonthlydata);
  //         return res.status(200).json({
  //           unique: uniquemonthlyparsed,
  //           reduntant: redunmonthlyparsed,
  //         });

  //       default:
  //         throw new ErrorHandler("invalid_type", 400);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     return res.status(err.status || 500).json({ message: err.message });
  //   }
  // }

  async vistitor(req, res) {
    try {
      const { user_type, customer_id } = req.params;
      const visitors = new VisitorSchema({
        user_type: +user_type,
        customer_id,
      });
      await visitors.save();
      let msg_type;
      if (+user_type === 0) {
        msg_type = "UNIQUE_USER";
      } else {
        msg_type = "REDUNTANT_USER";
      }
      return res.status(200).json({ message: msg_type });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async views(req, res) {
    try {
      const { user_type, customer_id, product_id } = req.params;

      const views = new ViewsSchema({
        user_type: +user_type,
        customer_id,
        product_id,
      });
      await views.save();

      let msg_type;
      if (+user_type === 0) {
        msg_type = "UNIQUE_USER";
      } else {
        msg_type = "REDUNTANT_USER";
      }

      return res.status(200).json({ msg: `VIEWS_INCREASED_${msg_type}` });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
}

module.exports = new UserController();
