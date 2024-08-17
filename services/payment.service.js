const ReserveItems = require("../model/reserve_items.model");
const Product = require("../model/product.model");

async function checkAndMakeReservation(cartItems, user_id) {
  try {
    // Check if any of the cart items are already reserved
    for (let item of cartItems) {
      let reservedItem = await ReserveItems.findOne({ product_id: item.product_id });
      if (reservedItem && reservedItem?.size._id === item?.selectedSize._id) {
        return {
          message: {
            success: false,
            message: "Some products are already reserved",
            unavailableProducts: {
              product_id: reservedItem.product_id,
              quantity: reservedItem.quantity,
              user_id: reservedItem.user_id,
            },
          },
        };
      }
    }

    // If all items are available, add them to the ReserveItems collection
    for (let item of cartItems) {
      let product = await Product.findOne({ _id: item.product_id });

      if (product && product.prod_quantity === 1) {
        let reservation = new ReserveItems({
          product_id: item.product_id,
          quantity: item.quantity,
          user_id: user_id,
          size: item.selectedSize, // Ensure size is saved
        });
        await reservation.save();
      }
    }

    return {
      message: {
        success: true,
        message: "All products are available",
      },
    };

  } catch (err) {
    throw err;
  }
}


async function checkProductAvailability(product){
  let reservedItem = await ReserveItems.findOne({ product_id: product._id });
  if (reservedItem && reservedItem?.size._id === product?.selectedSize._id) {
    return {
      message: {
        success: false,
        message: "product is already reserved",
      },
    };
  }
  return {
    message: {
      success: true,
      message: "product is available",
    },
  };
}



module.exports = {
  checkAndMakeReservation,
  checkProductAvailability
    };