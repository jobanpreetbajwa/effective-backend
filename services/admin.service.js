const AdminModel = require("../model/admin_login.model");
const ErrorHandler = require("../utils/errorHandler");
const UserModel = require("../model/user.model");
const OrderModel = require("../model/order.model");
const ProductModel = require("../model/product.model");
const ProductCategoryModel = require("../model/product_category.model");
const GlobalSettingsOrder = require("../model/global_setting_order.model");
const moment = require("moment");
const SettingModel = require("../model/settings.model");
const axios = require("axios");
const VisitorsModel = require("../model/vistiorsAnalytics.model");
const ViewModel = require("../model/viewsAnalytics.model");
//const PaymentSettingModel = require("../model/payment_setting.model");

const jwt = require("jsonwebtoken");

async function addAdmin(username, password) {
  if (!username || !password) {
    throw new ErrorHandler("CREDENTIALS_MISSING", 400);
  }
  let admin = new AdminModel({ username, password });

  await admin.save();

  let token = jwt.sign({ admin_id: admin._id }, process.env.JWT_SECRET);

  return token;
}

async function verifyAdmin(username, password) {
  if (!username || !password) {
    throw new ErrorHandler("CREDENTIALS_MISSING", 400);
  }
  let admin = await AdminModel.findOne({ username });

  if (!admin) {
    throw new ErrorHandler("NOT_FOUND", 400);
  }
  if (admin.password !== password) {
    throw new ErrorHandler("INVALID_PASSWORD", 400);
  }
  let token = jwt.sign({ admin_id: admin._id }, process.env.JWT_SECRET);
  return token;
}

async function findUser(user_name, phoneNumber) {
  let user = await UserModel.findOne({
    user_name,
    phoneNumber,
  });
  return user;
}

async function addUser(user_name, phoneNumber, address, email, user_image) {
  let user = new UserModel({
    user_name,
    phoneNumber,
    address,
    user_email: email,
    user_image,
  });
  await user.save();

  return user;
}

async function OrderUpdate(order_id, status) {
  if (!order_id) {
    throw new ErrorHandler("ORDER_ID_MISSING", 400);
  }

  const updateOrder = await OrderModel.findByIdAndUpdate(
    order_id,
    { $set: { status } },
    { new: true }
  )
    .lean()
    .populate("items.productId");

  if (updateOrder.status === 4) {
    const productIds = updateOrder.items.map((item) => item.productId);

    const products = await ProductModel.find({
      _id: { $in: productIds },
      inventory_available: true,
    });

    for (const product of products) {
      const correspondingItem = updateOrder.items.find((item) =>
        item.productId.equals(product._id)
      );

      if (correspondingItem) {
        product.prod_quantity += correspondingItem.quantity;
        await product.save();
      }
    }
  }

  // let discard_status = [0, 2, 4, 5];   //on status change send totalprice and no of items

  // if (updateOrder && updateOrder.items && updateOrder.items.length > 0) {
  //   updateOrder.items = updateOrder.items.filter((item) => {
  //     const productId = item.productId;
  //     return (
  //       productId &&
  //       !(productId.deletedAt && discard_status.includes(updateOrder.status))
  //     );
  //   });
  // }

  updateOrder.itemsCount = updateOrder?.items?.length;
  orderPriceCalculate([updateOrder]);

  return updateOrder;
}

async function getOrderById(order_id) {
  if (!order_id) {
    throw new ErrorHandler("ID_MISSING", 400);
  }
  const order = await OrderModel.findOne({ orderId: order_id })
    .lean()
    .populate({
      path: "items.productId",
      populate: "img_ids",
    })
    .populate("customerId");

  // order.items = order.items.filter(({ productId }) => {
  //   return (
  //     productId && !(productId.deletedAt && [0, 2, 4, 5].includes(order.status))
  //   );
  // });

  const categories = await ProductCategoryModel.find(
    {
      product: {
        $in: order.items.map(({ productId }) => productId._id),
      },
    },
    { product: 1, category: 1 }
  );

  order.items = order.items.map((item) => {
    let cat = categories.filter(({ product }) => {
      return product.toString() == item.productId._id.toString();
    });

    if (!cat?.[0]) return item;
    item.productId.category = cat[0].category;
    return item;
  });

  return order;
}

async function searchOrder(search) {
  const order_details = await OrderModel.find({
    $or: [
      { orderId: { $regex: new RegExp(`${search || ""}`, "i") } },
      {
        name: { $regex: new RegExp(`${search || ""}`, "i") },
      },
    ],
  })
    .populate("customerId")
    .populate("items.productId")
    .lean();
  for (const order of order_details) {
    const itemsCount = order.items ? order.items.length : 0;
    order.itemsCount = itemsCount;
  }
  await orderPriceCalculate(order_details);

  if (order_details.length === 0) {
    throw new ErrorHandler("ORDER_NOT_FOUND", 200);
  }
  return order_details;
}

// for (const order of orders) {       //price calculate on the basis of price from db
//   let totalAmount = 0;
//   for (const item of order.items) {
//     const product = await ProductModel.findById(item.productId).lean();

//     if (product) {
//       const { quantity } = item;
//       let price = 0;
//       if (product.mrp_price === 0 || product.discounted_price === 0) {
//         totalAmount = 0;
//         break;
//       }
//       if (product.prices && product.prices.length > 0) {
//         for (const p of product.prices) {
//           if (quantity >= p.from && quantity <= p.to) {
//             price = p.discounted_price || p.price;
//             break;
//           }
//         }
//       } else {
//         price = product.discounted_price || product.mrp_price;
//       }
//       totalAmount += price * quantity;
//     }
//   }
//   order.totalAmount = totalAmount;
//   // return totalAmount;
// }

async function orderPriceCalculate(orders) {
  for (const order of orders) {
    let totalAmount = 0;
    for (const item of order.items) {
      const { productId, quantity } = item;
      const price = productId.mrp_price;

      if (price === 0 || quantity === 0) {
        continue;
      } else {
        totalAmount += price * quantity;
      }
    }

    order.totalAmount = parseFloat(totalAmount.toFixed(2));
  }
}

async function addNote(order_id, admin_note) {
  if (!order_id) {
    throw new ErrorHandler("ORDER_ID_MISSING", 400);
  }
  const adminNote = await OrderModel.findOneAndUpdate(
    { orderId: order_id },
    { $set: { admin_note } },
    { new: true }
  );
  if (!adminNote) {
    throw new ErrorHandler("ORDER_ID_DOES_NOT_EXIST", 400);
  }
  return adminNote;
}

async function toggleSummary(orderId, showSummary) {
  const showsummary = await OrderModel.findOneAndUpdate(
    { orderId },
    { $set: { showSummary: showSummary == "0" ? false : true } },
    { new: true }
  ).select(" orderId showSummary");
  return showsummary;
}
async function no_oftoday_orders(cdate) {
  if (!cdate) {
    throw new ErrorHandler("invalid_date", 400);
  }

  const startDate = new Date(cdate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(cdate);
  endDate.setHours(23, 59, 59, 999);

  const orders = await OrderModel.find({
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  //const count = orders.length;
  const orderCounts = orders.map((order) => ({
    date: order.date,
    count: 1,
  }));

  await orderPriceCalculate(orders);

  const revenueByDate = orders.reduce((acc, order) => {
    const orderDate = order.date.toISOString();
    acc[orderDate] = (acc[orderDate] || 0) + order.totalAmount;
    return acc;
  }, {});

  const countsByDateTime = orderCounts.reduce((acc, curr) => {
    const key = curr.date.toISOString();
    acc[key] = (acc[key] || 0) + curr.count;
    return acc;
  }, {});

  return { countsByDateTime, revenueByDate };
}

async function no_ofweekly_orders(from_date, to_date) {
  if (!from_date || !to_date) {
    throw new ErrorHandler("Invalid_date", 400);
  }
  const startDate = new Date(from_date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(to_date);
  endDate.setHours(23, 59, 59, 999);

  const count = await OrderModel.find({
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  return count;
}

async function today_report_section(cdate) {
  const startDate = moment(cdate).startOf("day");

  const endDate = startDate.clone().endOf("day").hour(23).minute(59).second(59);

  const orders = await OrderModel.find({
    date: {
      $gte: startDate.toDate(),
      $lt: endDate.toDate(),
    },
  });

  await orderPriceCalculate(orders);

  const dailyData = orders.reduce((acc, order) => {
    const orderDate = moment.utc(order.date); // Convert order date to moment object
    const existingItemIndex = acc.findIndex(
      (item) => item.date === orderDate.format("YYYY-MM-DD")
    );
    if (existingItemIndex !== -1) {
      acc[existingItemIndex].totalOrders++;
      acc[existingItemIndex].revenue += order.totalAmount;
    } else {
      acc.push({
        date: orderDate.format("YYYY-MM-DDTHH:mm:ss"),
        totalOrders: 1,
        revenue: order.totalAmount,
      });
    }
    return acc;
  }, []);

  return dailyData;

  // const startDate = moment.utc(cdate).startOf("day");
  // const endDate = startDate.clone().endOf("day").hour(23).minute(59).second(59);

  // const orders = await OrderModel.find({
  //   date: {
  //     $gte: startDate.toDate(),
  //     $lt: endDate.toDate(),
  //   },
  // }).populate("items.productId");

  // await orderPriceCalculate(orders);

  // const dailyData = orders.reduce((acc, order) => {
  //   const orderDate = moment.utc(order.date);

  // if (order.status === 0) {
  //   const validItems = order.items.filter(
  //     (item) => !item.productId.deletedAt
  //   );
  //   const revenueFromValidItems = validItems.reduce((totalRevenue, item) => {
  //     return totalRevenue + item.price * item.quantity;
  //   }, 0);

  //   if (validItems.length > 0) {
  //     const existingItemIndex = acc.findIndex(
  //       (item) => item.date === orderDate
  //     );
  //     if (existingItemIndex !== -1) {
  //       acc[existingItemIndex].totalOrders++;
  //       acc[existingItemIndex].revenue += revenueFromValidItems;
  //     } else {
  //       acc.push({
  //         date: orderDate,
  //         totalOrders: 1,
  //         revenue: revenueFromValidItems,
  //       });
  //     }
  //   }
  //  } else {
  //     const existingItemIndex = acc.findIndex(
  //       (item) => item.date === orderDate
  //     );
  //     if (existingItemIndex !== -1) {
  //       acc[existingItemIndex].totalOrders++;
  //       acc[existingItemIndex].revenue += order.totalAmount;
  //     } else {
  //       acc.push({
  //         date: orderDate,
  //         totalOrders: 1,
  //         revenue: order.totalAmount,
  //       });
  //     }
  //   }

  //   return acc;
  // }, []);

  // return dailyData;

  // const startDate = new Date(cdate);
  // startDate.setHours(0, 0, 0, 0);
  // const endDate = new Date(cdate);
  // endDate.setHours(23, 59, 59, 999);

  // const orders = await OrderModel.find({
  //   date: {
  //     $gte: startDate,
  //     $lt: endDate,
  //   },
  // });

  // // const orderCounts = orders.map((order) => ({
  // //   date: order.date,
  // //   count: 1,
  // // }));

  // await orderPriceCalculate(orders);
  // // const revenueByDate = orders.reduce((acc, order) => {
  // //   const orderDate = order.date.toISOString();
  // //   acc[orderDate] = (acc[orderDate] || 0) + order.totalAmount;
  // //   return acc;
  // // }, {});

  // // const countsByDateTime = orderCounts.reduce((acc, curr) => {
  // //   const key = curr.date.toISOString();
  // //   acc[key] = (acc[key] || 0) + curr.count;
  // //   acc[key] = (acc[key] || 0) + curr.totalAmount;
  // //   return acc;
  // // }, {});

  // const dailyData = orders.reduce((acc, order) => {
  //   const orderDate = order.date.toISOString();
  //   const existingItemIndex = acc.findIndex((item) => item.date === orderDate);
  //   if (existingItemIndex !== -1) {
  //     acc[existingItemIndex].totalOrders++;
  //     acc[existingItemIndex].revenue += order.totalAmount;
  //   } else {
  //     acc.push({
  //       date: orderDate,
  //       totalOrders: 1,
  //       revenue: order.totalAmount,
  //     });
  //   }
  //   return acc;
  // }, []);

  // return dailyData;
}

async function weekly_report_section(cdate) {
  const currentDate = moment(cdate).startOf("day");

  const dayOfWeek = currentDate.day();
  const startOfWeek = currentDate.clone().startOf("week");

  const endOfDay = currentDate
    .clone()
    .endOf("day")
    .hour(23)
    .minute(59)
    .second(59);

  const dailyOrders = await OrderModel.find({
    date: {
      $gte: startOfWeek.toDate(),
      $lt: endOfDay.toDate(),
    },
  });

  //dailyOrders.items=dailyOrders.items.filter((item) => !item.productId.deletedAt);

  await orderPriceCalculate(dailyOrders);

  const dailyData = dailyOrders.reduce((acc, order) => {
    const orderDate = moment.utc(order.date).format("YYYY-MM-DD");
    acc[orderDate] = acc[orderDate] || { totalOrders: 0, revenue: 0 };
    acc[orderDate].totalOrders++;
    acc[orderDate].revenue += order.totalAmount;
    return acc;
  }, {});

  const weekly_report = [];
  for (let i = 1; i <= dayOfWeek; i++) {
    const day = startOfWeek.clone().add(i, "days");
    const key = day.format("YYYY-MM-DD");
    weekly_report.push({
      day: day.format("dddd"),
      totalOrders: dailyData[key] ? dailyData[key].totalOrders : 0,
      revenue: dailyData[key] ? dailyData[key].revenue : 0,
    });
  }

  //    if(order.status===0)
  // {
  //   const validProducts=order.items.filter((item)=>
  //     !item.productId.deletedAt
  //   )

  //       console.log(validProducts)
  //       validItemRevenu=validProducts.reduce((revenue,item)=>
  //       {
  //         return revenue + item.price * item.quantity
  //       })

  //
  //   if (validItems.length > 0) {
  //     const existingItemIndex = acc.findIndex(
  //       (item) => moment.utc(item.date).format("YYYY-MM-DD") === orderDate
  //     );
  //     if (existingItemIndex !== -1) {
  //       acc[existingItemIndex].totalOrders++;
  //       acc[existingItemIndex].revenue += revenueFromValidItems;
  //     } else {
  //       acc.push({
  //         date: orderDate,
  //         totalOrders: 1,
  //         revenue: revenueFromValidItems,
  //       });
  //     }
  //   }
  // else {
  //     const existingItemIndex = acc.findIndex(
  //       (item) => item.date === orderDate
  //     );
  //     if (existingItemIndex !== -1) {
  //       acc[existingItemIndex].totalOrders++;
  //       acc[existingItemIndex].revenue += order.totalAmount;
  //     } else {
  //       acc.push({
  //         date: orderDate,
  //         totalOrders: 1,
  //         revenue: order.totalAmount,
  //       });
  //     }

  //     //}

  return weekly_report;
}

async function monthly_report_section(cdate) {
  const currentDate2 = new Date(cdate);
  const currentYear = currentDate2.getFullYear();
  const currentMonth = currentDate2.getMonth();

  const monthly_report = [];
  for (let month = 0; month <= 11; month++) {
    const startOfMonth = new Date(currentYear, month, 1, 0, 0, 0);

    const endOfMonth = new Date(currentYear, month + 1, 0, 23, 59, 59); // Last day of the month

    const monthlyOrders = await OrderModel.find({
      date: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    await orderPriceCalculate(monthlyOrders);

    const monthlyData = monthlyOrders.reduce((acc, order) => {
      const orderDate = order.date.toISOString().split("T")[0];
      acc[orderDate] = acc[orderDate] || { totalOrders: 0, revenue: 0 };
      acc[orderDate].totalOrders++;
      acc[orderDate].revenue += order.totalAmount;
      return acc;
    }, {});

    //  console.log(monthlyData);

    // (item) => item.date.toISOString().split("T")[0] === orderDate

    let totalOrders = 0;
    let totalRevenue = 0;
    for (const key in monthlyData) {
      // diff objects in monthlyData monthwise so sum all object in one
      totalOrders += monthlyData[key].totalOrders;
      totalRevenue += monthlyData[key].revenue;
    }

    const monthName = new Date(currentYear, month).toLocaleString("en-US", {
      month: "long",
    });
    monthly_report.push({
      month: monthName,
      totalOrders,
      revenue: totalRevenue,
    });
  }

  return monthly_report;
}

async function reportSection(cdate, type) {
  switch (+type) {
    case 0:
      const today_report = await today_report_section(cdate);
      return today_report;
    case 1:
      const weekly_report = await weekly_report_section(cdate);
      return weekly_report;
    case 2:
      const monthly_report = await monthly_report_section(cdate);
      return monthly_report;

    default:
      throw new ErrorHandler("invalid_type", 400);
  }
}

async function toggleGlobalSummary(globalShowSummary) {
  const settings = await GlobalSettingsOrder.findOne();
  if (!settings) {
    await GlobalSettingsOrder.create({ globalShowSummary: true });
    return { globalShowSummary: true }; // Default value
  }

  const showsummary = await GlobalSettingsOrder.findOneAndUpdate(
    { _id: settings._id },
    { $set: { globalShowSummary: globalShowSummary == "0" ? false : true } },
    { new: true }
  );
  return showsummary;
}

async function getGlobalSummary() {
  const settings = await GlobalSettingsOrder.findOne();
  return { globalShowSummary: settings ? settings.globalShowSummary : false };
}

async function TotalReportSummary(cdate) {
  const currentDate = moment.utc(cdate);

  const startDate = currentDate.clone().startOf("day");
  const endDate = currentDate.clone().endOf("day");

  const dailyOrders = await OrderModel.find({
    date: {
      $gte: startDate.toDate(),
      $lte: endDate.toDate(),
    },
  });

  await orderPriceCalculate(dailyOrders);

  let dailyTotalOrders = dailyOrders.length;
  let dailyTotalRevenue = dailyOrders.reduce(
    (total, order) => total + order.totalAmount,
    0
  );
  // const uniqueVisitors = await VisitorsModel.find({
  //   createdAt: {
  //     $gte: startDate.toDate(),
  //     $lte: endDate.toDate(),
  //   },
  // }).select("createdAt -_id");
  const uniqueVisitors = await VisitorsModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
        user_type: 0,
      },
    },
    {
      $group: {
        _id: "$customer_id",
      },
    },
  ]);

  const totalTodayVisitors = uniqueVisitors.length;

  // const startOfYear = currentDate.clone().startOf("year");

  // // End of the year (December 31st)
  // const endOfYear = currentDate.clone().endOf("year");

  const startOfMonth = currentDate.clone().startOf("year");
  const endOfMonth = currentDate.clone().endOf("year");

  const monthlyOrders = await OrderModel.find({
    date: {
      $gte: startOfMonth.toDate(),
      $lte: endOfMonth.toDate(),
    },
  });

  await orderPriceCalculate(monthlyOrders);

  let monthlyTotalOrders = monthlyOrders.length;
  let monthlyTotalRevenue = monthlyOrders.reduce(
    (total, order) => total + order.totalAmount,
    0
  );
  const uniqueMonthlyVisitors = await VisitorsModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfMonth.toDate(),
          $lte: endOfMonth.toDate(),
        },
        user_type: 0,
      },
    },
    {
      $group: {
        _id: "$customer_id",
      },
    },
  ]);

  const totalMonthlyVisitors = uniqueMonthlyVisitors.length;

  const startOfWeek = currentDate.clone().startOf("week");
  const endOfWeek = currentDate.clone().endOf("week");

  const weeklyOrders = await OrderModel.find({
    date: {
      $gte: startOfWeek.toDate(),
      $lte: endOfWeek.toDate(),
    },
  });

  await orderPriceCalculate(weeklyOrders);

  let weeklyTotalOrders = weeklyOrders.length;
  let weeklyTotalRevenue = weeklyOrders.reduce(
    (total, order) => total + order.totalAmount,
    0
  );
  const uniqueweeklyVisitors = await VisitorsModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfWeek.toDate(),
          $lte: endOfWeek.toDate(),
        },
        user_type: 0,
      },
    },
    {
      $group: {
        _id: "$customer_id",
      },
    },
  ]);

  const totalWeeklyVisitors = uniqueweeklyVisitors.length;

  return {
    today: {
      orders: dailyTotalOrders,
      sales: dailyTotalRevenue,
      visitors: totalTodayVisitors,
    },
    week: {
      orders: weeklyTotalOrders,
      sales: weeklyTotalRevenue,
      visitors: totalWeeklyVisitors,
    },
    month: {
      orders: monthlyTotalOrders,
      sales: monthlyTotalRevenue,
      visitors: totalMonthlyVisitors,
    },
  };
}

//async function pending_orders_report() {
//   const pending_orders = await OrderModel.find({ status: 0 });

//   const productsData = pending_orders.reduce((acc, order) => {
//     const product_id = order.items.productId;
//     acc[product_id] = acc[product_id] || { total_quantity: 0 };
//     acc[product_id].total_quantity +=order.items.quantity;
//     return acc;
//   }, {});
// const products=[]

// products.push(
//   {

//   }
// )

async function pending_orders_report(limit, page) {
  // const skip = (page - 1) * limit;

  // const pendingOrders = await OrderModel.aggregate([
  //   {
  //     $match: { status: 0 },
  //   },
  //   {
  //     $unwind: "$items",
  //   },
  //   {
  //     $group: {
  //       _id: "$items.productId",
  //       totalQuantity: { $sum: "$items.quantity" },
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "products",
  //       localField: "_id",
  //       foreignField: "_id",
  //       as: "product",
  //     },
  //   },
  //   {
  //     $match: {
  //       product: { $ne: [] },
  //     },
  //   },
  //   {
  //     $match: {
  //       "product.deletedAt": null,
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       productName: { $arrayElemAt: ["$product.name", 0] },
  //       totalQuantity: 1,
  //     },
  //   },
  //   // {
  //   //   $skip: skip,
  //   // },
  //   // {
  //   //   $limit: limit,
  //   // },
  // ]);

  // if (limit && page) {
  //   const startIndex = (page - 1) * limit;
  //   const endIndex = page * limit;
  //   return pendingOrders.slice(startIndex, endIndex);
  // }

  // return pendingOrders;

  const pipeline = [
    {
      $match: { status: 0 },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.productId",
        totalQuantity: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $match: {
        product: { $ne: [] },
      },
    },
    {
      $project: {
        _id: 0,
        productName: { $arrayElemAt: ["$product.name", 0] },
        totalQuantity: 1,
      },
    },
    { $sort: { totalQuantity: 1, productName: 1 } },
  ];

  let pendingOrders = await OrderModel.aggregate(pipeline);

  const totalProducts = await OrderModel.aggregate([
    ...pipeline,
    { $count: "totalProducts" },
  ]);

  const totalProductsCount =
    totalProducts.length > 0 ? totalProducts[0].totalProducts : 0;

  pendingOrders.totalProducts = totalProductsCount;

  if (limit && page) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    pendingOrders = pendingOrders.slice(startIndex, endIndex);
  }

  return { pendingOrders, totalProducts: totalProductsCount };

  // $match: {
  //   $or: [
  //     { "product.deletedAt": { $exists: false } },
  //     { "product.deletedAt": null },
  //   ],
  // },
  //return pendingOrders;
}

async function product_status_orderd(limit, page, sort_bit) {
  // const pageSize = +limit || 10;
  // const pageNumber = +page || 1;

  // const skip = (pageNumber - 1) * pageSize;
  const sortStage =
    sort_bit === "1"
      ? { orders: -1, createdAt: 1, productName: 1 }
      : { views: -1, createdAt: 1, productName: 1 };

  const pipeline = [
    { $match: { status: { $in: [0, 1, 2, 3, 4, 5] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        orders: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $match: {
        product: { $ne: [] },
      },
    },
    {
      $project: {
        _id: 1,
        productName: { $arrayElemAt: ["$product.name", 0] },
        orders: 1,
      },
    },
    { $sort: sortStage },
  ];

  let orders = await OrderModel.aggregate(pipeline);

  for (const order of orders) {
    const viewsCount = await ViewModel.countDocuments({
      product_id: order._id,
    });

    order.views = viewsCount;
  }

  const totalProducts = orders.length;

  let result = orders;

  if (sort_bit === "1") {
    result.sort(
      (a, b) =>
        b.orders - a.orders || a.productName.localeCompare(b.productName)
    );
  } else {
    result.sort(
      (a, b) => b.views - a.views || a.productName.localeCompare(b.productName)
    );
  }

  if (limit && page) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    result = result.slice(startIndex, endIndex);
  }

  return { products: result, totalProducts };
}

async function settingsUpdate(update) {
  const settings = await SettingModel.findOneAndUpdate(
    {},
    { $set: update },
    { new: true }
  ).populate("img_ids");
  return settings;
}

async function getSetting() {
  const profile = await SettingModel.findOne().populate("img_ids");

  return profile;
}

async function vistiorsData(cdate, type) {
  switch (+type) {
    case 0:
      const startDate = moment(cdate).startOf("day");

      const endDate = startDate
        .clone()
        .endOf("day")
        .hour(23)
        .minute(59)
        .second(59);

      const uniqueVisitors = await VisitorsModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate.toDate(),
              $lte: endDate.toDate(),
            },
            user_type: 0,
          },
        },
        {
          $addFields: {
            createdAtIST: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S",
                date: {
                  $toDate: { $add: ["$createdAt", 5.5 * 60 * 60 * 1000] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$customer_id",
            createdAtIST: { $push: "$createdAtIST" },
          },
        },
      ]);

      const redundantVisitors = await VisitorsModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate.toDate(),
              $lte: endDate.toDate(),
            },
          },
        },
        {
          $addFields: {
            createdAtIST: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S",
                date: {
                  $toDate: { $add: ["$createdAt", 5.5 * 60 * 60 * 1000] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            createdAtIST: { $push: "$createdAtIST" },
          },
        },
      ]);

      return [{ unique: uniqueVisitors }, { reduntant: redundantVisitors }];

    case 1:
      const currentDate = moment(cdate).startOf("day");

      const startOfWeek = currentDate.clone().startOf("week");

      const endOfDay = currentDate
        .clone()
        .endOf("day")
        .hour(23)
        .minute(59)
        .second(59);

      const uniqueweeklyVisitors = await VisitorsModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfWeek.toDate(),
              $lt: endOfDay.toDate(),
            },
            user_type: 0,
          },
        },
        {
          $group: {
            _id: "$customer_id",
            visits: { $push: "$createdAt" },
          },
        },
      ]);
      // const uniqueweeklyVisitors = await VisitorsModel.find({
      //   createdAt: {
      //     $gte: startOfWeek.toDate(),
      //     $lt: endOfDay.toDate(),
      //   },
      //   user_type: 0,
      // }).select("createdAt -_id");

      const reduntanteweeklyVisitors = await VisitorsModel.find({
        createdAt: {
          $gte: startOfWeek.toDate(),
          $lte: endOfDay.toDate(),
        },
      }).select("createdAt -_id");

      const weeklyVisitorCounts = Array.from({ length: 7 }, (_, i) => {
        const day = moment().day(i);
        const dayName = day.format("dddd");

        const uniqueCount = uniqueweeklyVisitors.filter(
          (item) => moment(item.createdAt).day() === i
        ).length;

        const redundantCount = reduntanteweeklyVisitors.filter(
          (item) => moment(item.createdAt).day() === i
        ).length;

        return {
          day: dayName,
          uniqueVisitors: uniqueCount,
          redundantVisitors: redundantCount,
        };
      });
      return weeklyVisitorCounts;

    case 2:
      const currentDate1 = new Date(cdate);
      const currentYear = currentDate1.getFullYear();

      const monthlyVisitorCounts = [];

      for (let month = 0; month < 12; month++) {
        const startOfMonth = new Date(currentYear, month, 1, 0, 0, 0);
        const endOfMonth = new Date(currentYear, month + 1, 0, 23, 59, 59); // Last day of the month

        const uniqueMonthlyVisitors = await VisitorsModel.aggregate([
          {
            $match: {
              createdAt: {
                $gte: startOfMonth,
                $lt: endOfMonth,
              },
              user_type: 0,
            },
          },
          {
            $group: {
              _id: "$customer_id",
              visits: { $push: "$createdAt" },
            },
          },
        ]);

        const redundantMonthlyVisitors = await VisitorsModel.find({
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        });

        const uniqueCount = uniqueMonthlyVisitors.length;
        const redundantCount = redundantMonthlyVisitors.length;

        const monthName = moment(startOfMonth).format("MMMM");

        monthlyVisitorCounts.push({
          month: monthName,
          uniqueVisitors: uniqueCount,
          redundantVisitors: redundantCount,
        });
      }

      return monthlyVisitorCounts;

    default:
      throw new ErrorHandler("invalid_type", 400);
  }
}
module.exports = {
  addAdmin,
  verifyAdmin,
  findUser,
  addUser,
  OrderUpdate,
  getOrderById,
  searchOrder,
  orderPriceCalculate,
  addNote,
  toggleSummary,
  no_oftoday_orders,
  no_ofweekly_orders,
  reportSection,
  toggleGlobalSummary,
  getGlobalSummary,
  TotalReportSummary,
  pending_orders_report,
  product_status_orderd,
  settingsUpdate,
  //paymentSettingUpdate,
  getSetting,
  vistiorsData,
};
