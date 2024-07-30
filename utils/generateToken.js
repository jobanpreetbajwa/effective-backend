const jwt = require("jsonwebtoken");
const IdGenerator = require("otp-generator");

class GenerateToken {
  async generatedeviceToken(obj, secret) {
    let token = jwt.sign(obj, secret);

    return token;
  }

  async generateOrderId() {
    const usedIDs = new Set();

    function generateUniqueID(length) {
      const order_id = IdGenerator.generate(length, {
        upperCaseAlphabets: true,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true,
      });

      if (usedIDs.has(order_id)) {
        return generateUniqueID(length);
      }

      usedIDs.add(order_id);

      return order_id;
    }
    return generateUniqueID(6);
  }
}

module.exports = new GenerateToken();
