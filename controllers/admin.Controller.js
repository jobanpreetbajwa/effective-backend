const {
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
  paymentSettingUpdate,
  getSetting,
  vistiorsData,
} = require("../services/admin.service");
const ErrorHandler = require("../utils/errorHandler");
const SettingModel = require("../model/settings.model");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../config/fileUpload");
const OrderModel = require("../model/order.model");

class AdminControllers {
  /**
   * Controller function to add a new category.
   * This function handles the request to add a new category and ensures proper transaction management.
   *
   * @param {Object} req - The request object, containing the request body with category details.
   * @param {Object} res - The response object used to send the response back to the client.
   *
   * @returns {Promise<void>} - Returns a response with the added category or an error message.
   */

  async addAdmin(req, res) {
    const { username, password } = req.body;
    try {
      let token = await addAdmin(username, password);

      let admin = await AdminModel.findOne({ username });

      const adminsettings = new SettingModel({
        //settings will be created when admin is created
        email: admin.email,
      });
      await adminsettings.save();

      return res.status(200).json({ token });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async loginAdmin(req, res) {
    const { username, password } = req.body;
    try {
      let token = await verifyAdmin(username, password); //login admin
      return res.status(200).json({ token });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async add_User(req, res) {
    try {
      const { name, phoneNumber, address, email } = req.body;
      if (!name || !phoneNumber) {
        throw new ErrorHandler("CREDENTIALS_MISSING", 400);
      }
      let alreadyExist = await findUser(name, phoneNumber); // user is added

      if (alreadyExist) {
        return res
          .status(200)
          .json({ msg: "USER ALREADY EXISTS", alreadyExist });
      }
      let img_url;
      if (req.file) {
        const { url, public_id } = await uploadFile(req.file);
        img_url = url;
      }

      let user = await addUser(name, phoneNumber, address, email, img_url);

      let token = jwt.sign(
        { name: user.user_name, phoneNumber: user.phoneNumber },
        process.env.JWT_SECRET
      );

      res.status(200).json({ token, user });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getOrders(req, res) {
    try {
      const { page, limit } = req.params;
      const { date, status } = req.body;

      let query = {};
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query.date = { $gte: startDate, $lte: endDate };
      }
      if (status !== null) {
        if (status === "") {
          query.status = { $in: [0, 1, 2, 3, 4, 5] };
        } else {
          query.status = status;
        }
      }

      const totalOrders = await OrderModel.countDocuments(query);

      let orders = await OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean()
        .populate("customerId")
        .populate("items.productId");

      // let discard_status = [0, 2, 4, 5];

      // orders = orders.map((order) => {
      //   order.items = order.items.filter(({ productId }) => {
      //     return (
      //       productId &&
      //       !(productId.deletedAt && discard_status.includes(order.status))
      //     );
      //   });
      //   return order;
      // });

      // if (orders.length === 0) {
      //   throw new ErrorHandler("NO_ORDER_TILL_DATE", 200);
      // }

      for (const order of orders) {
        const itemsCount = order.items ? order.items.length : 0;
        order.itemsCount = itemsCount;
      }
      await orderPriceCalculate(orders);

      //orders.map((order) => delete order.items);

      return res.status(200).json({ orders, totalOrders });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const { order_id } = req.params;
      const getOrder = await getOrderById(order_id);
      return res.status(200).json(getOrder);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStatusOrder(req, res) {
    try {
      const { order_id } = req.params;
      const { status } = req.body;

      const order = await OrderUpdate(order_id, status);

      return res.status(200).json(order);
    } catch (err) {
      console.log(err);
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async searchOrder(req, res) {
    try {
      const { search } = req.body;
      const order = await searchOrder(search);
      return res.status(200).json(order);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async addNote(req, res) {
    try {
      const { order_id } = req.params;
      const { note } = req.body;
      const admin_note = await addNote(order_id, note);
      return res.status(200).json(admin_note);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async toggleSummary(req, res) {
    try {
      const { order_id, showSummary } = req.params;
      const response = await toggleSummary(order_id, showSummary);
      return res.status(200).json(response);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async no_of_today_orders(req, res) {
    const { cdate } = req.params;
    try {
      const number_of_orders = await no_oftoday_orders(cdate);
      return res.json(number_of_orders);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async report_section(req, res) {
    const { date, type } = req.params;
    try {
      const report = await reportSection(date, type);
      return res.status(200).json(report);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
  async getGlobalSummary(req, res) {
    try {
      const response = await getGlobalSummary();
      return res.status(200).json(response);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
  async toggleGlobalSummary(req, res) {
    try {
      const { globalShowSummary } = req.params;
      const response = await toggleGlobalSummary(globalShowSummary);
      return res.status(200).json(response);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async no_of_weekly_orders(req, res) {
    const { from_date, to_date } = req.params;
    try {
      const number_of_orders = await no_ofweekly_orders(from_date, to_date);

      return res.json(number_of_orders);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async total_report_summary(req, res) {
    const { date } = req.params;
    try {
      const report = await TotalReportSummary(date);

      return res.status(200).json(report);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async pending_orders_product_report(req, res) {
    try {
      const page = req.params.page || 1;
      const limit = req.params.limit || 10;
      const products_report = await pending_orders_report(limit, page);
      return res.status(200).json(products_report);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async product_status_report(req, res) {
    try {
      const page = req.params.page || 1;
      const limit = req.params.limit || 10;
      const sort = req.params.sort;
      const products_report = await product_status_orderd(limit, page, sort);
      return res.status(200).json(products_report);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async settingUpdate(req, res) {
    try {
      const { update } = req.body;
      const update_setting = await settingsUpdate(update);
      return res.status(200).json(update_setting);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  // async paymentSettingsUpdate(req, res) {
  //   try {
  //     const { update } = req.body;

  //     const paymentSetting = await paymentSettingUpdate(update);
  //     return res.status(200).json(paymentSetting);
  //   } catch (err) {
  //     return res.status(err.status || 500).json({ message: err.message });
  //   }
  // }

  async getSettings(req, res) {
    try {
      const settings = await getSetting();
      return res.status(200).json(settings);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async visitorGraph(req, res) {
    try {
      const { type, date } = req.params;
      const visitors = await vistiorsData(date, type);
      return res.status(200).json(visitors);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateOrder(req, res) {
    try {
      const { order_ids ,status,msg} = req.body;
      const order = await UpdateOrdersStatus(order_ids, status,msg);
      return res.status(200).json(order);
    }
    catch(err){
      return res.status(err.status || 500).json({ message: err.message });
    }
}
}
module.exports = new AdminControllers();
