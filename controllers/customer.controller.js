const {
  getCustomers,
  getCustomersExcel,
  searchCustomers,
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
}

module.exports = new CustomerController();
