const UserModel = require("../model/user.model");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
console.log(secretKey,"secret key")
const {
  getCustomers,
  getCustomersExcel,
  searchCustomers,
  emailVerify,
  otpVerify,
  resendOtp,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  getUserDetails,
} = require("../services/customer.service");


class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const { page, limit, type } = req.params;
      const themePreview = await getCustomers(type, page, limit);
      return res.status(201).json(themePreview);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
  async searchCustomers(req, res, next) {
    try {
      const { query } = req.body;
      const { page, limit, type } = req.params;
      const themePreview = await searchCustomers(query, type, page, limit);
      return res.status(201).json(themePreview);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
  async getCustomersExcel(req, res, next) {
    try {
      const { type } = req.params;
      let workbook = await getCustomersExcel(type);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=customers.xlsx"
      );

      await workbook.xlsx.write(res);
      return res.end();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async emailVerify(req, res, next) {
    try {
      const { email } = req.body;
      const response = await emailVerify(email);
      return res.status(201).json(response);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async otpVerify(req, res, next) {
    try {
      const { otp, user_id } = req.body;
      const response = await otpVerify(otp, user_id);
      return res.status(201).json(response);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async resendOtp(req, res, next) {
    try {
      const { user_id } = req.body;
      const response = await resendOtp(user_id);
      return res.status(201).json(response);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async addToWishlist(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });

      jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });

        const user = await UserModel.findById(decoded.user_id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { productId } = req.body;
        const response = await addToWishlist(user._id, productId);
        return res.status(201).json(response);
      });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getWishlist(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });

      jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token', error: err.message });
        }
        const response = await getWishlist(decoded.user_id);
        return res.status(201).json(response);
      });
  
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async removeFromWishlist(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });

      jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });

        const user = await UserModel.findById(decoded.user_id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { productId } = req.body;
        const response = await removeFromWishlist(user._id, productId);
        return res.status(201).json(response);
      });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getCustomer(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });

      jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });

        const user = await getUserDetails(decoded.user_id);

        return res.status(201).json(user);
      });
    } catch (err) {
      console.log(err);
      return res.status(err.status || 500).json({ message:{
        success:false,
        message: err.message,
      } });
    }
  }
}

module.exports = new CustomerController();
