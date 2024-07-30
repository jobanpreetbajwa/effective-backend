const mongoose = require("mongoose");

const globalSettingsOrderSchema = new mongoose.Schema({
  globalShowSummary: {
    type: Boolean,
    default: true,
  },
});

const GlobalSettingsOrder = mongoose.model(
  "GlobalSettingsOrder",
  globalSettingsOrderSchema
);

module.exports = GlobalSettingsOrder;
