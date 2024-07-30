const {
  addProduct,
  getProductById,
  getSubCategoryByProduct,
  searchProduct,
  delete_Product,
  editProduct,
  deleteImage,
  reorderProducts,
  delete_Varients,
  addBulkProducts,
  updateProductStatus,
  bulk_delete_Product,
  searchProductByCategory,
  editBulkProducts,
  getProductsExcel,
  getProductsSampleExcel,
} = require("../services/product.service");
const ProductCategoryModel = require("../model/product_category.model");
const SubCategoryModel = require("../model/subcategory.model");
const CategoryModel = require("../model/category.model");
const ErrorHandler = require("../utils/errorHandler");
const ProductModel = require("../model/product.model");
const { getSubCategoryByCategory } = require("../services/category.service");

class ProductController {
  async addProduct(req, res) {
    try {
      const products = req.body; // Assuming req.body is an array of objects
      const parentProductData = products[0]; // Parent product data
      const category_id = products[0].category_id;

      const parentProduct = await addProduct(parentProductData);
      const parentId = parentProduct._id;
      // Create variants with parent_id
      const variantProducts = products.slice(1).map((variant) => {
        return { ...variant, parent_id: parentId, srn: parentProduct.srn };
      });

      const variants = await Promise.all(
        variantProducts.map(async (variant) => {
          let {
            _id,
            discounted_price,
            max_order_quantity,
            min_order_quantity,
            img_ids,
            weight,
            shipping_cost,
            size,
            color,
          } = await addProduct(variant);
          return {
            _id,
            discounted_price,
            max_order_quantity,
            min_order_quantity,
            img_ids,
            weight,
            shipping_cost,
            size,
            color,
            category_id,
          };
        })
      );

      const parent_product_details = parentProduct._doc; // Convert Mongoose document to object

      return res
        .status(200)
        .json({ ...parent_product_details, variants, category_id });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async addBulkProducts(req, res) {
    try {
      const { category_id } = req.params;
      let products = req.body;
      products = await addBulkProducts(products, category_id);
      return res.status(200).json(products);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const {
        products,
        delete_images,
        delete_variants,
        subcategories,
        category_id,
      } = req.body;

      const parentProduct = products[0];
      const productId = parentProduct._id;

      // Delete images
      await deleteImage(delete_images, { product_id: productId }, 1);

      // Update or insert subcategories for parent product
      let category = category_id;
      if (subcategories) {
        const subcategoryNames = subcategories;
        const insert = await Promise.all(
          subcategoryNames.map(async (subcategory) => {
            let subCategoryModel = await SubCategoryModel.findOne({
              name: subcategory,
            });
            if (!subCategoryModel) {
              subCategoryModel = new SubCategoryModel({ name: subcategory });
              await subCategoryModel.save();
            }
            return new ProductCategoryModel({
              product: productId,
              category,
              subCategory: subCategoryModel._id,
            });
          })
        );
        await ProductCategoryModel.deleteMany({
          product: productId,
          subCategory: { $ne: null },
        });
        await ProductCategoryModel.insertMany(insert);
      }

      // Update parent product
      let updatedParentProduct = await editProduct(parentProduct, productId);

      // Add variants that do not have an _id
      const newVariants = products.slice(1).filter((variant) => !variant._id);
      for (const newVariant of newVariants) {
        const variantProductId = (await addProduct(newVariant))._id;
        const subcategoryNames = subcategories;
        const insert = await Promise.all(
          subcategoryNames.map(async (subcategory) => {
            let subCategoryModel = await SubCategoryModel.findOne({
              name: subcategory,
            });
            if (!subCategoryModel) {
              subCategoryModel = new SubCategoryModel({ name: subcategory });
              await subCategoryModel.save();
            }
            return new ProductCategoryModel({
              product: variantProductId,
              category,
              subCategory: subCategoryModel._id,
            });
          })
        );
        await ProductCategoryModel.deleteMany({
          product: variantProductId,
          subCategory: { $ne: null },
        });
        await ProductCategoryModel.insertMany(insert);

        await editProduct(newVariant, variantProductId);
      }

      // Update or delete existing variants
      const existingVariants = products
        .slice(1)
        .filter((variant) => variant._id);
      for (const existingVariant of existingVariants) {
        const variantProductId = existingVariant._id;

        // Update or insert subcategories for variant
        if (subcategories) {
          const subcategoryNames = subcategories;
          const insert = await Promise.all(
            subcategoryNames.map(async (subcategory) => {
              let subCategoryModel = await SubCategoryModel.findOne({
                name: subcategory,
              });
              if (!subCategoryModel) {
                subCategoryModel = new SubCategoryModel({ name: subcategory });
                await subCategoryModel.save();
              }
              return new ProductCategoryModel({
                product: variantProductId,
                category,
                subCategory: subCategoryModel._id,
              });
            })
          );
          await ProductCategoryModel.deleteMany({
            product: variantProductId,
            subCategory: { $ne: null },
          });
          await ProductCategoryModel.insertMany(insert);
        }

        // Update variant product
        await editProduct(existingVariant, variantProductId);
      }
      for (const deleteVariant of delete_variants) {
        const variantProductId = deleteVariant;
        await delete_Varients(variantProductId, category);
      }

      updatedParentProduct = await getProductById(productId);

      res.status(200).json({ product: updatedParentProduct });
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ message: err.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { product_id, category_id } = req.params;
      let product = await delete_Product(product_id, category_id);
      return res.status(200).json({ message: "PRODUCT_DELETED", product });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  async deleteBulkProduct(req, res) {
    try {
      const { category_id } = req.params;
      const { product_ids } = req.body;
      let products = await bulk_delete_Product(product_ids, category_id);
      return res.status(200).json({ message: "PRODUCT_DELETED", products });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  async getProductById(req, res) {
    try {
      const { product_id } = req.params;
      let product = await getProductById(product_id);
      let { subCategories } = await getSubCategoryByProduct(product_id);
      return res.status(200).json({ product, subCategories });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
  async getSubCategoryByProduct(req, res) {
    try {
      let { product_id } = req.params;
      let product = await getProductById(product_id);
      let { subCategories } = await getSubCategoryByProduct(product_id);

      res.status(200).json({ product, subCategories });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
  async searchProduct(req, res) {
    try {
      let categories = await searchProduct(req.body.name);

      res.status(200).json(categories);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
  async searchProductByCategory(req, res) {
    try {
      const { category_id } = req.params;
      let products = await searchProductByCategory(category_id, req.body.name);
      let subcategories = await getSubCategoryByCategory(category_id);

      const totalProducts = products.length;

      res.status(200).json({ products, subcategories, totalProducts });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async reorderProducts(req, res) {
    try {
      let { category_id, product_id } = req.params;
      let { from, to } = req.body;
      let categories = await reorderProducts(
        +from,
        +to,
        product_id,
        category_id
      );

      res.status(200).json(categories);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async updateProductStatus(req, res) {
    try {
      let { status, product_id } = req.params;
      let product = await updateProductStatus(product_id, status);

      res.status(200).json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async editBulkProducts(req, res) {
    try {
      let products = req.body;
      let product = await editBulkProducts(products);

      res.status(200).json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async getProductsExcel(req, res, next) {
    try {
      const { category_id } = req.params;
      let workbook = await getProductsExcel(category_id);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=products.xlsx"
      );

      await workbook.xlsx.write(res);
      return res.end();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
  async getProductsSampleExcel(req, res, next) {
    try {
      const { category_id } = req.params;
      let workbook = await getProductsSampleExcel(category_id);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=sample.xlsx");

      await workbook.xlsx.write(res);
      return res.end();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
}

module.exports = new ProductController();
