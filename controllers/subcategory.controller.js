const {
  addSubCategory,
  addMulSubCategory,
  addNewMulSubCategory,
} = require("../services/subcategory.service");

class SubCategoryController {
  async addSubCategory(req, res) {
    try {
      let { category_id } = req.params;
      let { name } = req.body;
      let subcategory = await addSubCategory(name, category_id);

      res.status(200).json(subcategory);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
  async addMulSubCategory(req, res) {
    try {
      let { category_id } = req.params;
      let { names } = req.body;
      let subcategory = await addMulSubCategory(names, category_id);

      res.status(200).json(subcategory);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
  async addNewMulSubCategory(req, res) {
    try {
      let { category_id } = req.params;
      let { names } = req.body;
      names = JSON.parse(names);
      let subcategory = await addNewMulSubCategory(names, category_id);

      res.status(200).json(subcategory);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new SubCategoryController();
