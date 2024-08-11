const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    otp: {
        type: String,
        required: [true, "OTP is required"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: Date.now() + 5 * 60 * 1000,
    },
    });

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;