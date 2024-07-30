const { validateToken } = require("../utils/validateToken");
const AdminModel = require("../models/admin");
const ErrorHandler = require("../utils/errorHandler");

class Auth {
  authAdmin = async (req, res, next) => {
    let data;
    try {
      data = validateToken(req.headers);
      const admin = await AdminModel.find({ _id: data.admin_id });
      if (admin) {
        req.admin = admin;
        next();
      } else {
        throw new ErrorHandler("NOT_AUTHORISED");
      }
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };
}
module.exports = new Auth();
