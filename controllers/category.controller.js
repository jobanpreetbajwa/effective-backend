const {
  addCategory,
  getProductsByCategory,
  getSubCategoryByCategory,
  searchCategory,
  findCategory,
  getAllCategories,
  getProductsBySubCategories,
  reorderCategories,
  findCategories,
  addBulkCategories,
  getProductsLimitByCategory,
  filter_products_by_subcategories,
} = require("../services/category.service");

const { addNewMulSubCategory } = require("../services/subcategory.service");
const CategoryModel = require("../model/category.model");
const ProductModel = require("../model/product.model");
const ProductCategoryModel = require("../model/product_category.model");
const ErrorHandler = require("../utils/errorHandler");
const ThemePreviewModel = require("../model/theme_preview.model");
const mongoose = require("mongoose");
const { deleteImage } = require("../services/product.service");

class CategoryController {
  async addCategory(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { name } = req.body;

      if (!name) {
        throw new ErrorHandler("CREDENTIALS_MISSING", 400);
      }
      let alreadyExist = await findCategory(req.body.name);

      if (alreadyExist) {
        return res.status(400).json({ message: "ALREADY_EXIST" });
      }
      let category = await addCategory(req.body, session);
      await session.commitTransaction();
      return res.status(200).json(category);
    } catch (err) {
      await session.abortTransaction();
      res.status(err.status || 500).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async addBulkCategories(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let categories = req.body;

      let alreadyExist = await findCategories(
        categories.map(({ name }) => name)
      );

      let alreadyExistNames = alreadyExist.map(
        ({ category_name }) => category_name
      );

      categories = categories.filter(({ name }) => {
        return !alreadyExistNames.includes(name);
      });
      let categoriesAdded = await addBulkCategories(categories, session);
      await session.commitTransaction();
      return res
        .status(200)
        .json({ categories: categoriesAdded, alreadyExist: alreadyExistNames });
    } catch (err) {
      await session.abortTransaction();
      res.status(err.status || 500).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async getProductsByCategory(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { category_id } = req.params;
      let products = await getProductsByCategory(category_id);
      let subcategories = await getSubCategoryByCategory(category_id);

      res.status(200).json({ products, subcategories });
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async getProductsLimitByCategory(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let { category_id, limit, page } = req.params;
      const { subcategory } = req.body;

      let products = await getProductsLimitByCategory(category_id, limit, page);
      console.log(JSON.stringify(products, null, 2), "products"); // Ensure proper logging
      let subcategories = await getSubCategoryByCategory(category_id);
      let subcategoryProducts;
      if (subcategory?.length) {
        subcategoryProducts = await filter_products_by_subcategories(
          category_id,
          subcategory,
          page,
          limit
        );
        return res.status(200).json(subcategoryProducts);
      }

      let totalProducts = await ProductCategoryModel.find({
        category: category_id,
        product: { $ne: null },
        subCategory: null,
      }).distinct("product");

      totalProducts = await ProductModel.find({
        _id: { $in: totalProducts.map((product) => product) },
      })
        .select("_id")
        .lean();

      totalProducts = totalProducts.length;

      res.status(200).json({ products, subcategories, totalProducts });
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async getSubCategoryByCategory(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let { category_id } = req.params;
      let subcategories = await getSubCategoryByCategory(category_id);

      res.status(200).json(subcategories);
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    }
  }
  async searchCategory(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let categories = await searchCategory(req.body.name);

      res.status(200).json(categories);
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }
  async getAllCategories(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let categories = await getAllCategories(req.body.name);

      res.status(200).json(categories);
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
      let { subcategories } = req.body;

      let products = await getProductsBySubCategories(
        category_id,
        subcategories
      );

      res.status(200).json(products);
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;

      let {
        update,
        subcategoryName,
        imageUpdate,
        bannerUpdate,
        deletes,
        img_delete,
        bannerDelete,
      } = req.body;

      if (img_delete) {
        await deleteImage(img_delete, { category_id: categoryId }, 1);
      }

      if (bannerDelete) {
        await deleteImage(bannerDelete, { category_id: categoryId }, 2);
      }

      if (deletes) {
        await ProductCategoryModel.deleteMany({
          category: categoryId,
          subCategory: { $in: deletes },
        });
      }

      if (subcategoryName) {
        await addNewMulSubCategory(subcategoryName, categoryId);
      }

      const subcategories = await getSubCategoryByCategory(categoryId);

      if (imageUpdate) {
        const category = await CategoryModel.findById(categoryId);
        const existingImageId = category.img_ids[0];

        await deleteImage(existingImageId, { category_id: categoryId }, 1);

        await CategoryModel.findByIdAndUpdate(
          categoryId,
          { $set: { img_ids: imageUpdate } },
          { new: true }
        );
      }

      if (bannerUpdate) {
        await CategoryModel.findByIdAndUpdate(
          categoryId,
          {
            $addToSet: { banner_ids: { $each: bannerUpdate } },
          },
          { new: true }
        );
      }

      let updatedCategory;
      if (update) {
        const { category_name } = update;
        const existingCategory = await CategoryModel.findOne({ category_name });
        if (
          existingCategory &&
          existingCategory._id.toString() !== categoryId
        ) {
          throw new ErrorHandler("CATEGORY_ALREADY_EXISTS_WITH_SAME_NAME", 400);
        }
      }
      updatedCategory = await CategoryModel.findByIdAndUpdate(
        categoryId,
        update,
        { new: true }
      )
        .populate("img_ids banner_ids")
        .lean();

      let products = await ProductModel.find({ parent_id: null }).lean();

      let totalproducts = await ProductCategoryModel.find({
        category: categoryId,
        product: { $in: products.map(({ _id }) => _id) },
        subCategory: null,
      }).lean();

      let items = totalproducts.length;

      updatedCategory.items = items;

      return res
        .status(200)
        .json({ message: "SUCCESS", updatedCategory, subcategories });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async deleteCategory(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { categoryId } = req.params;
      const products = await ProductCategoryModel.find({
        category: categoryId,
        product: { $ne: null },
      }).distinct("product");
      await ThemePreviewModel.updateMany(
        { type: 2 },
        { $pull: { product_ids: { $in: products } } }
      );
      await ProductModel.updateMany(
        { _id: { $in: products } },
        { deletedAt: Date.now() }
      ).session(session);
      if (!products) {
        throw new ErrorHandler("product_DO_NOT _EXISTS", 400);
      }
      await ProductCategoryModel.deleteMany({ category: categoryId }).session(
        session
      );
      let category = await CategoryModel.findById(categoryId);
      await deleteImage(category.img_ids, { category_id: categoryId }, 1);
      await deleteImage(category.banner_ids, { category_id: categoryId }, 2);
      category = await CategoryModel.findByIdAndDelete(categoryId);

      await CategoryModel.updateMany(
        { srn: { $gt: category.srn } },
        { $inc: { srn: -1 } }
      ).session(session);
      await session.commitTransaction();
      return res.status(200).json(category);
    } catch (err) {
      await session.abortTransaction();
      res.status(500).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async reorderCategories(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let { from, to, category_id } = req.body;
      let categories = await reorderCategories(
        +from,
        +to,
        category_id,
        session
      );
      await session.commitTransaction();
      return res.status(200).json(categories);
    } catch (err) {
      await session.abortTransaction();
      return res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }

  async reorderCategory(req, res) {
    try {
      const { list, category_id } = req.body;
      if (category_id) {
        console.log(list.length);
        for (let index = 0; index < list.length; index++) {
          const productId = list[index];

          const product = await ProductModel.findById(productId);
          if (product) {
            product.srn = index + 1;
            await product.save();
          }
        }
      } else {
        for (let index = 0; index < list.length; index++) {
          const categoryId = list[index];

          const category = await CategoryModel.findById(categoryId);
          if (category) {
            category.srn = index + 1;
            await category.save();
          }
        }
      }
      return res.status(200).json({ msg: "success" });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new CategoryController();
