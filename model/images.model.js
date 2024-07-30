const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Category Schema
const imagesSchema = new Schema({
  url: {
    type: String,
  },
  public_id: {
    type: String,
  },
});

const Image = mongoose.model("Image", imagesSchema);
module.exports = Image;
