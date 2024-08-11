const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      // required: true,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    user_email: {
      type: String,
      required: [true, "Email is required"],
    },
    user_image: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Image",
        },
      ],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
