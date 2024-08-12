const mongoose = require("mongoose");

const reserveItemsSchema = mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, 'Product ID is required.'],
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User ID is required.'],
    },

    timeStamp: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: Date.now() + 1000 * 60 * 60 * 24, // 24 hours from now
        index: { expires: '1d' } // TTL index to expire documents after 1 day
    },
    });

const ReserveItems = mongoose.model("ReserveItems", reserveItemsSchema);
module.exports = ReserveItems;