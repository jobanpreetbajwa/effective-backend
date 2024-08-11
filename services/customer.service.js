const OrderModel = require("../model/order.model");
const UserModel = require("../model/user.model");
const VisitorsModel = require("../model/vistiorsAnalytics.model");
const Excel = require("exceljs");
const ErrorHandler = require("../utils/errorHandler");
const OTP = require("../model/otp_verification.model");

async function getCustomers(type, pageNumber, pageSize) {
  let customers = await OrderModel.aggregate([
    {
      $group: {
        _id: "$customerId",
        count: { $sum: 1 },
        totalUserNotes: {
          $sum: { $cond: [{ $ne: ["$user_note", ""] }, 1, 0] },
        },
      },
    },
  ]);

  let users;

  let searchBy = {};

  switch (+type) {
    case 0:
      searchBy = { user_name: 1 };
      break;
    case 1:
      searchBy = { user_name: -1 };
      break;
    case 2:
      searchBy = { user_name: 1 };
      break;
    case 3:
      searchBy = { user_name: 1 };
      break;
  }

  users = await UserModel.find({
    _id: { $in: customers.map(({ _id }) => _id) },
  })
    .sort(searchBy)
    .lean();

  let customerViews = await VisitorsModel.aggregate([
    {
      $group: {
        _id: "$customer_id",
        count: { $sum: 1 },
      },
    },
  ]);

  customerViews = customerViews.reduce((acc, val) => {
    acc[val._id] = val.count;
    return acc;
  }, {});

  let response = users.reduce((acc, val) => {
    for (let { _id, count, totalUserNotes } of customers) {
      if (val._id.toString() === _id.toString()) {
        acc.push({
          ...val,
          orders: count,
          enquiries: totalUserNotes,
          views: customerViews[val._id] || 0,
        });
        break;
      }
    }
    return acc;
  }, []);

  switch (+type) {
    case 0:
      break;
    case 1:
      break;
    case 2:
      response.sort((a, b) => b.orders - a.orders);
      break;
    case 3:
      response.sort((a, b) => a.orders - b.orders);
      break;
  }
  if (pageNumber && pageSize) {
    const start = (pageNumber - 1) * pageSize;
    const end = start + +pageSize;
    response = response.slice(start, end);
  }

  return { customers: response, totalCount: customers.length };
}

async function getCustomersExcel(type) {
  let { customers } = await getCustomers(type);

  let workbook = new Excel.Workbook();
  let worksheet = workbook.addWorksheet("Customers");

  worksheet.columns = [
    { header: "User Name", key: "user_name", width: 20 },
    { header: "Phone Number", key: "phoneNumber", width: 15 },
    { header: "Address", key: "address", width: 30 },
    { header: "User Email", key: "user_email", width: 30 },
    { header: "Orders", key: "orders", width: 10 },
    { header: "Enquiries", key: "enquiries", width: 10 },
    { header: "Views", key: "views", width: 10 },
  ];

  customers.forEach((customer) => {
    worksheet.addRow({
      user_name: customer.user_name,
      phoneNumber: customer.phoneNumber,
      address: customer.address,
      user_email: customer.user_email,
      orders: customer.orders,
      enquiries: customer.enquiries,
      views: customer.views,
    });
  });
  return workbook;
}

async function searchCustomers(searchQuery, type, pageNumber, pageSize) {
  let customers = await OrderModel.aggregate([
    {
      $group: {
        _id: "$customerId",
        count: { $sum: 1 },
        totalUserNotes: {
          $sum: { $cond: [{ $ne: ["$user_note", ""] }, 1, 0] },
        },
      },
    },
  ]);

  switch (+type) {
    case 0:
      searchBy = { user_name: 1 };
      break;
    case 1:
      searchBy = { user_name: -1 };
      break;
    case 2:
      searchBy = { user_name: 1 };
      break;
    case 3:
      searchBy = { user_name: 1 };
      break;
  }

  let users = await UserModel.find({
    _id: { $in: customers.map(({ _id }) => _id) },
    $or: [
      { user_name: { $regex: new RegExp(searchQuery, "i") } },
      { address: { $regex: new RegExp(searchQuery, "i") } },
      { user_email: { $regex: new RegExp(searchQuery, "i") } },
      { phoneNumber: { $regex: new RegExp(searchQuery, "i") } },
    ], // Case-insensitive search
  })
    .sort(searchBy)
    .lean();

  let totalCount = users.length;

  let customerViews = await VisitorsModel.aggregate([
    {
      $group: {
        _id: "$customer_id",
        count: { $sum: 1 },
      },
    },
  ]);

  customerViews = customerViews.reduce((acc, val) => {
    acc[val._id] = val.count;
    return acc;
  }, {});

  let response = users.reduce((acc, val) => {
    for (let { _id, count, totalUserNotes } of customers) {
      if (val._id.toString() === _id.toString()) {
        acc.push({
          ...val,
          orders: count,
          enquiries: totalUserNotes,
          views: customerViews[val._id] || 0,
        });
        break;
      }
    }
    return acc;
  }, []);

  switch (+type) {
    case 0:
      break;
    case 1:
      break;
    case 2:
      response.sort((a, b) => b.orders - a.orders);
      break;
    case 3:
      response.sort((a, b) => a.orders - b.orders);
      break;
  }

  const start = (pageNumber - 1) * pageSize;
  const end = start + +pageSize;
  response = response.slice(start, end);

  return { customers: response, totalCount };
}

async function emailVerify(email) {

  const otp = Math.floor(100000 + Math.random() * 900000);
  // send email verification link with otp
  const user = await UserModel.findOne({ user_email: email });
  if (!user) {
    // create new user
    const newUser = new UserModel({
      user_name: email,
      user_email: email,
    }); 
    await newUser.save();

    // create otp for this new User
    const otpData = new OTP({
      user_id: newUser._id,
      otp: otp,
    });
    await otpData.save();
    return { message: "Email verification link sent", otp: otp,user_id: newUser._id };
  }
  else {
    // create otp for existing User
    const otpData = new OTP({
      user_id: user._id,
      otp: otp,
    });
    await otpData.save();
    return { message: "Email verification link sent", otp: otp,user_id: user._id };
  }
  
}

async function otpVerify(otp, user_id) {
  const otpData = await OTP.findOne({ otp, user_id });
  if (!otpData) {
    throw new ErrorHandler("Invalid OTP", 400);
  }
  await OTP.deleteOne({ otp, user_id });
  return { message: "Email verified" };
}

module.exports = {
  getCustomers,
  getCustomersExcel,
  searchCustomers,
  emailVerify,
  otpVerify,
};
