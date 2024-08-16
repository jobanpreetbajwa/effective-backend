const mongoose = require("mongoose");

const sizeChartSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    sizes: {
        type: [
            {
                size: {
                    type: String,
                    required: true,
                },
                count: {
                    type: Number,
                    required: true,
                },
            },
        ],
        validate: {
            validator: function (v) {
                return v.length > 0;
            },
            message: "At least one size entry is required.",
        },
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    });

const SizeChart = mongoose.model("SizeChart", sizeChartSchema);
module.exports = SizeChart;