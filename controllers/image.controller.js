const { DeleteFileFromCloudinary } = require("../config/cloudinary");
const { uploadFile } = require("../config/fileUpload");
const ImageModel = require("../model/images.model");
const CategoryModel = require("../model/category.model");
const ErrorHandler = require("../utils/errorHandler");

class ImageController {
  async uploadImage(req, res) {
    try {

      const { url, public_id } = await uploadFile(req.file);
   
      const image = new ImageModel({
        url,
        public_id,
      });

      await image.save();
      return res.status(200).json(image);
    } catch (err) {
    
      return res.status(400).json({ message: err.message });
    }
  }

  async deleteImage(req, res) {
    try {
      let { img_ids, category_id, product_id, type } = req.body;

      let images = await ImageModel.find({ _id: { $in: img_ids } });
      let public_ids = [];
      let ids = [];
      for (const image of images) {
        public_ids.push(image.public_id);
        ids.push(image._id);
      }

      let update;

      if (category_id) {
        switch (+type) {
          case 1: {
            update = await CategoryModel.findByIdAndUpdate(category_id, {
              $pull: { img_ids: { $in: ids } },
            });
            break;
          }
          case 2: {
            update = await CategoryModel.findByIdAndUpdate(category_id, {
              $pull: { banner_ids: { $in: ids } },
            });
            break;
          }
        }
      }
      if (product_id) {
        switch (+type) {
          case 1: {
            update = await ProductModel.findByIdAndUpdate(product_id, {
              $pull: { img_ids: { $in: ids } },
            });
            break;
          }
        }
      }
      await DeleteFileFromCloudinary(public_ids);
      res.status(200).json(update);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async deleteUntrackedImages(req, res) {
    try {
      let { img_ids } = req.body;

      let images = await ImageModel.find({ _id: { $in: img_ids } });
      let public_ids = [];
      let ids = [];

      for (const image of images) {
        public_ids.push(image.public_id);
        ids.push(image._id);
      }

      let result = await ImageModel.deleteMany({ _id: { $in: ids } });
      if (public_ids.length > 0) await DeleteFileFromCloudinary(public_ids);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new ImageController();
